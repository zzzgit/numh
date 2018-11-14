const path = require('path')
const fs = require("fs")
const fsPromises = fs.promises
const os = require('os')
const excel = require("./excel.js")
const ora = require('ora')
const cheerio = require('cheerio')
const template = require('url-template')
const samael = require("samael")
const perloin = require("perloin")
// const rbb = require("./rbb.js")
// const iconv = require('iconv-lite')


let run = function (entity, context) {	// 这个函数必须返回promise，不管异步还是同步
	return samael.fetch(entity.url).then(text => {
		//let text = iconv.decode(text, 'gb2312')
		const $ = cheerio.load(text)
		let resource = $((context.states.tsp === "ltxuanhao") ? "div.page1 > ul:nth-child(2)>li>table tr[align=center]" : ".registItemsn>li>table tr[align=center]")
		if (!resource || !resource.length) {
			// throw new Error(`[perloin][document]: no data!`)
			console.log(`[number-hunter]: 该页无数据： ${entity.url}`)	// 为何显示不出来
			return null
		}
		let str = ""
		resource.each((index, item) => {
			let children = $(item).children()
			if (children.eq(3).find("a")) {
				str += `${children.eq(0).text()}\t${children.eq(1).text()}\t${children.eq(2).text()}\r\n`
			}
			if (children.eq(7).find("a")) {
				str += `${children.eq(4).text()}\t${children.eq(5).text()}\t${children.eq(6).text()}\r\n`
			}
		})
		context.counter++
		samael.appendToFile(path.join(os.homedir(), `Desktop/numh/${Math.floor(context.counter * 50 / 60000) + "." + context.fileName}`), str).catch(err => {
			if (err) throw err
		})
	}).catch(e => {
		console.error("任务出错：", e)	// 是否需要记录错误信息
		record(entity, context)
	})
}

let record = (entity, context) => {
	samael.appendToFile(path.join(os.homedir(), `Desktop/numh/failed.txt`), entity.url + "\r\n").catch(err => {
		if (err) throw err
	})
	run(entity, context)
}

async function getHandle(path) {
	let filehandle
	try {
		filehandle = await fsPromises.open(path, 'r')
	} catch (e) {
		throw e
	}
	return filehandle
}

const transferFile = async (file) => {
	let handle = await getHandle(file)
	handle.readFile({ encoding: "utf8" }).then(str => {
		let results = []
		let arr = str.split("\r\n")
		arr.forEach(item => {
			let segments = item.split("\t")
			if (!segments || !segments.length || segments.length < 3) {
				return null
			}
			let row = []
			segments.forEach(seg => {
				row.push(seg)
			})
			results.push(row)
		})
		return results
	}).catch(e => {
		throw e
	}).then(results => {
		let temp = excel.init()
		excel.fill(results, temp)
		excel.write(file + ".xlsx", temp)
	}).catch(e => {
		throw e
	})
}

// let generateDetector = (templetStr) => {
// 	return async (num) => {
// 		let url = template.parse(templetStr).expand({
// 			pageNo: num
// 		})
// 		return fetch(url).then(data => {
// 			// 解析之
// 			return true
// 		}).catch(e => {
// 			if (e.code === 500) {
// 				return false
// 			}
// 		})
// 	}
// }


const boot = async (states) => {
	let urlTemplate = `http://${states.province}.tiaohao.com/${states.tsp}/?page_no={pageNo}`
	if (!states.isSpecial) {
		urlTemplate += `&dis=${states.city}`
	}
	if (states.package) {
		urlTemplate += `&zifei=${states.package}`
	}
	if (states.price!==-1) {
		urlTemplate += `&jiage=${states.price}`
	}
	let spinner = ora('[number-hunter]: 正在探测域名映射...').start()
	let domainWord = await samael.checkRedirect(`http://${states.province}.tiaohao.com/${states.isSpecial ? "" : "?dis=" + states.city}`).then(text => {
		return text.match(/^http:\/\/(\w+)\./)[1]
	}).catch(e => {
		spinner.fail(`[number-hunter]: 检测域名失败！`)
		throw e
	})
	spinner.info(`[number-hunter]: 检测域名成功！`)
	urlTemplate = urlTemplate.replace(/^http:\/\/\w+\./, `http://${domainWord}.`)
	console.log(`[number-hunter]: urlTemplate '${urlTemplate}'`)
	spinner = ora('[number-hunter]: 正在探测页数...').start()
	// let border = await rbb.find(1, 99999, generateDetector(urlTemplate)) 两种探测方式
	let border = await samael.fetch(template.parse(urlTemplate).expand({ pageNo: 1 })).then(text => {
		const $ = cheerio.load(text)
		const form = $("#form1")
		const match = form.text().match(/共(\d+)页/)
		if (!match || !match.length || !match[1]) {
			return 1
		}
		return +(form.text().match(/共(\d+)页/)[1])
	}).catch(e => {
		spinner.fail(`[number-hunter]: 检测页数失败！`)
		throw e
	})
	spinner.info(`[number-hunter]: 一共${border}页，计划约需耗时${samael.formatTimeRange(border * states.interval)}`)
	let plan = {
		name: `${states.province}.${states.city || "0"}.${states.tsp}.${states.package || "all"}`,
		urlTemplate: urlTemplate,
		urlPhases: {
			pageNo: {
				type: perloin.type.increasing,
				init: 1,
				step: 1,
				until: border
			},
		},
		interval: states.interval,
		context: {
			fileName: `${states.province}.${states.city || "0"}.${states.tsp}.${states.package || "all"}.txt`,
			states,
			counter: 0
		},
		execute: run,
	}
	perloin.run(plan).then(() => {
		if (typeof plan === "object"){
			return null
		}
		console.log(`[number-hunter]: 开始转换文件...`)
		let folder = path.join(os.homedir(), `Desktop/numh/`)
		return fsPromises.readdir(folder, { encoding: "utf8" }).catch(e => {
			throw e
		}).then(files => {
			files.forEach(file => {
				if (file.includes("failed.txt") || !file.includes(`.txt`)) {
					return null
				}
				console.log(`[number-hunter]: ${file} --> ${file}.xlsx`)
				transferFile(path.join(folder, `${file}`))
			})
		})
	})
}


module.exports = {
	boot
}

const path = require('path')
const fs = require("fs")
const fsPromises = fs.promises
const os = require('os')
const excel = require("./excel.js")
const ora = require('ora')
// const cheerio = require('cheerio')
const template = require('url-template')
const samael = require("samael")
const perloin = require("perloin")
// const rbb = require("./rbb.js")
// const iconv = require('iconv-lite')


let run = function (entity, context) {	// 这个函数必须返回promise，不管异步还是同步
	let url = new URL(entity.url)
	return samael.fetch(entity.url, {
		'Referer': url.href,
		'Host': url.host,
	}).then(text => {
		//let text = iconv.decode(text, 'gb2312')
		let arr = text.split("|")
		if (!arr.length) {
			// throw new Error(`[perloin][document]: no data!`)
			console.log(`[number-hunter]: 该页无数据： ${entity.url}`)	// 为何显示不出来
			return null
		}
		arr.shift()
		let str = ""
		arr.forEach((item) => {
			const data = item.split(",")
			if(data[5]==="0"){
				str += `${data[0]}\t${data[4]}\t${+data[3]+(+data[4])}\r\n`
			}
		})
		context.counter++
		samael.appendToFile(path.join(os.homedir(), `Desktop/numh/${Math.floor(context.counter * 50 / 600000) + "." + context.fileName}`), str).catch(err => {
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
	let filehandle = await fsPromises.open(path, 'r')
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
	// 51.asp?  numcategory=0   birth=  
	const secondLevelDomain = "haoma"  
	let urlTemplate = `http://${states.province}.${secondLevelDomain}.com/io/5.asp?cnt=50&page_no={pageNo}&lanmu=${states.tsp}`
	if (!states.isSpecial) {
		urlTemplate += `&dis=${states.city}`
	}
	if (states.package) {
		urlTemplate += `&zifei=${states.package}`
	}
	if (states.price!==-1) {
		urlTemplate += `&jiage=${states.price}`
	}
	if (states.prefix!==-1) {
		urlTemplate += `&haoduan=${states.prefix}`
	}
	let spinner = ora('[number-hunter]: 正在探测三級域名映射...').start()
	let thirdLevelDomain = await samael.checkRedirect(`http://${states.province}.${secondLevelDomain}.com/${states.isSpecial ? "" : "?dis=" + states.city}`).then(text => {
		return text.match(/^http:\/\/(\w+)\./)[1]
	}).catch(e => {
		spinner.fail(`[number-hunter]: 检测三級域名失败！`)
		throw e
	})
	spinner.info(`[number-hunter]: 检测三級域名成功！`)
	urlTemplate = urlTemplate.replace(/^http:\/\/\w+\./, `http://${thirdLevelDomain}.`)
	console.log(`[number-hunter]: urlTemplate '${urlTemplate}'`)
	spinner = ora('[number-hunter]: 正在探测页数...').start()
	// let border = await rbb.find(1, 99999, generateDetector(urlTemplate)) 两种探测方式
	let border = await samael.fetch(template.parse(urlTemplate).expand({ pageNo: 1 }), {
		'Referer': `http://${thirdLevelDomain}.${secondLevelDomain}.com/xh/?dis=6&lanmu=0`,
		'Host': `${thirdLevelDomain}.${secondLevelDomain}.com`,}).then(text => {
		let page = text.replace(/\|.+/, "")
		return +page || 1
	}).catch(e => {
		spinner.fail(`[number-hunter]: 检测页数失败！`)
		throw e
	})
	spinner.info(`[number-hunter]: 一共${border}页，计划约需耗时${samael.formatTimeRange(border * states.interval)}`)
	let date_tmp = new Date()
	let timestamp = date_tmp.getSeconds() + "" + date_tmp.getMilliseconds()
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
			fileName: `${states.province}.${states.city || "0"}.${states.tsp}.${states.package || "all"}.${states.price || "價格"}.${timestamp}.txt`,
			states,
			counter: 0
		},
		execute: run,
	}
	let waiting = (states.timer_interval || 0)*60*60*1000
	new Promise((resolve) => {
		console.log(`[number-hunter]: 開始定時...`)
		setTimeout(() => {
			resolve()
		}, waiting)
	}).then(()=>{
		console.log(`[number-hunter]: 定時結束`)
		perloin.run(plan).then(() => {
			if (typeof plan === "object") {
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
	})
}


module.exports = {
	boot
}

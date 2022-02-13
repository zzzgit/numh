const path = require("path")
const cheerio = require('cheerio')
const perloin = require("perloin")
const tsp = require("../bin/data/tsp")
const samael = require("samael")

// 这一行由第一步获取，从浏览器中复制来
let areas = { "sz": { "name": "广东省", "children": [{ "name": "深圳", "value": "6" }, { "name": "广州", "value": "1" }, { "name": "东莞", "value": "2" }, { "name": "惠州", "value": "4" }, { "name": "佛山", "value": "3" }, { "name": "中山", "value": "5" }, { "name": "珠海", "value": "8" }, { "name": "湛江", "value": "9" }, { "name": "梅州", "value": "10" }, { "name": "潮州", "value": "11" }, { "name": "肇庆", "value": "12" }, { "name": "茂名", "value": "13" }, { "name": "阳江", "value": "14" }, { "name": "江门", "value": "16" }, { "name": "云浮", "value": "17" }, { "name": "清远", "value": "18" }, { "name": "韶关", "value": "19" }, { "name": "河源", "value": "21" }, { "name": "汕尾", "value": "22" }, { "name": "汕头", "value": "23" }] } }

let hand = function (task, context) {	// 这个函数必须返回promise，不管异步还是同步
	return samael.fetch(task.url).then(text => {
		const $ = cheerio.load(text)
		let temp = $("body > div.wrap > div.r > div.attribute-box div.sl-value div.sl-v-tab div.trig-item")
		temp = temp.filter((index, item) => {
			item = $(item)
			return item.text().includes("默认套餐") || item.text().includes("资费套餐")
		})
		let wrapper = temp.find("div.sl-value.valueList>ul")
		let str = ""
		wrapper.children().each((index, item) => {
			item = $(item)
			// if (item.hasClass("curr")) {
			// 	return true
			// }
			if (item.data("father") != task.phase.tsp) {
				return true
			}
			str += `\t{ value: ${item.data("val")},\t`
			str += `name: "${item.text()}" },\r\n`
		})
		let isSpecial = areas[context.provCode].isSpecial
		let result = `"${context.provCode}${isSpecial ? "" : ("." + context.city.value)}.${task.phase.tsp}": [\r\n${str}\r\n],\r\n`
		samael.appendToFile(path.resolve(__dirname, "../bin/data/pkgs.js"), result)
	}).catch(() => {
		let isSpecial = areas[context.provCode].isSpecial
		let result = `"${context.provCode}${isSpecial ? "" : ("." + context.city.value)}.${task.phase.tsp}": [\r\n\r\n],\r\n`
		samael.appendToFile(path.resolve(__dirname, "../bin/data/pkgs.js"), result)
		//throw e
	})
}

let lastPlan = Promise.resolve()
for (let provCode in areas) {
	let taskInterval = 1.5
	let item = areas[provCode]
	if (item.isSpecial) {
		let plan = {
			name: `${provCode}`,
			urlTemplate: `http://${provCode}.haoma.com/xh/?lanmu={tsp}`,
			urlPhases: {
				tsp: {
					type: perloin.type.iterating,
					set: tsp.map(item => item.value)
				},
			},
			interval: taskInterval,
			execute: hand,
			context: { provCode }
		}
		lastPlan = lastPlan.then(() => perloin.run(plan))
	} else {
		areas[provCode].children.forEach(city => {
			lastPlan = lastPlan.then(() => {
				return samael.checkRedirect(`http://${provCode}.haoma.com/xh/?dis=${city.value}&lanmu=${tsp[0].value}`).then(url => url.match(/^http:\/\/(\w+)\./)[1])
			}).then((domain) => {
				let plan = {
					name: `${domain}.${city.name}`,
					urlTemplate: `http://${domain}.haoma.com/xh/?dis=${city.value}&lanmu={tsp}`,
					urlPhases: {
						tsp: {
							type: perloin.type.iterating,
							set: tsp.map(item => item.value)
						},
					},
					interval: taskInterval,
					execute: hand,
					context: { city, provCode }
				}
				perloin.run(plan)
			})
		})
	}
}

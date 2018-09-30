const URL = require("url").URL
const path = require("path")
const cheerio = require('cheerio')
const perloin = require("perloin")
const fetch = require("../fetch")
const tsp = require("../bin/data/tsp")
const utils = require("../utils.js")

// 这一行由第一步获取，从浏览器中复制来
let areas = { "www": { "name": "北京", "isSpecial": true }, "tj": { "name": "天津", "isSpecial": true }, "sh": { "name": "上海", "isSpecial": true }, "gd": { "name": "广东省", "children": [{ "name": "深圳", "value": "6" }, { "name": "广州", "value": "1" }, { "name": "东莞", "value": "2" }, { "name": "惠州", "value": "4" }, { "name": "佛山", "value": "3" }, { "name": "中山", "value": "5" }, { "name": "珠海", "value": "8" }, { "name": "湛江", "value": "9" }, { "name": "梅州", "value": "10" }, { "name": "潮州", "value": "11" }, { "name": "肇庆", "value": "12" }, { "name": "茂名", "value": "13" }, { "name": "阳江", "value": "14" }, { "name": "揭阳", "value": "15" }, { "name": "江门", "value": "16" }, { "name": "云浮", "value": "17" }, { "name": "清远", "value": "18" }, { "name": "韶关", "value": "19" }, { "name": "河源", "value": "21" }, { "name": "汕尾", "value": "22" }, { "name": "汕头", "value": "23" }] }, "cq": { "name": "重庆", "isSpecial": true }, "zj": { "name": "浙江省", "children": [{ "name": "杭州", "value": "1" }, { "name": "温州", "value": "2" }, { "name": "宁波", "value": "3" }, { "name": "台州", "value": "4" }, { "name": "金华 ", "value": "5" }, { "name": "湖州", "value": "6" }] }, "fj": { "name": "福建省", "children": [{ "name": "福州", "value": "1" }, { "name": "厦门", "value": "2" }, { "name": "泉州", "value": "3" }, { "name": "莆田", "value": "5" }, { "name": "漳州", "value": "4" }] }, "cd": { "name": "四川省", "children": [{ "name": "成都", "value": "1" }, { "name": "绵阳", "value": "2" }, { "name": "南充", "value": "3" }, { "name": "德阳", "value": "5" }, { "name": "达州", "value": "6" }, { "name": "雅安", "value": "7" }, { "name": "资阳", "value": "8" }, { "name": "广元", "value": "9" }, { "name": "宜宾", "value": "10" }] }, "xa": { "name": "陕西省", "children": [{ "name": "西安", "value": "1" }, { "name": "渭南", "value": "7" }, { "name": "延安", "value": "2" }, { "name": "榆林", "value": "3" }, { "name": "咸阳", "value": "4" }, { "name": "宝鸡", "value": "5" }, { "name": "安康", "value": "6" }, { "name": "商洛", "value": "8" }, { "name": "汉中", "value": "9" }, { "name": "铜川", "value": "10" }] }, "ha": { "name": "河南省", "children": [{ "name": "郑州", "value": "1" }, { "name": "洛阳", "value": "2" }, { "name": "新乡", "value": "3" }, { "name": "安阳", "value": "4" }, { "name": "开封", "value": "5" }, { "name": "南阳", "value": "6" }, { "name": "商丘", "value": "7" }, { "name": "驻马店", "value": "8" }, { "name": "许昌", "value": "9" }, { "name": "周口", "value": "10" }, { "name": "平顶山", "value": "11" }, { "name": "濮阳", "value": "12" }] }, "sd": { "name": "山东省", "children": [{ "name": "青岛", "value": "1" }, { "name": "济南", "value": "2" }, { "name": "济宁", "value": "7" }, { "name": "潍坊", "value": "6" }] }, "js": { "name": "江苏省", "children": [{ "name": "南京", "value": "1" }, { "name": "苏州", "value": "2" }, { "name": "徐州", "value": "3" }, { "name": "南通", "value": "4" }] }, "hb": { "name": "湖北省", "children": [{ "name": "武汉", "value": "1" }, { "name": "宜昌", "value": "2" }, { "name": "襄阳", "value": "3" }, { "name": "十堰", "value": "5" }, { "name": "宜昌", "value": "6" }, { "name": "黄石", "value": "4" }, { "name": "襄阳", "value": "7" }, { "name": "鄂州", "value": "8" }, { "name": "荆门", "value": "9" }, { "name": "恩施", "value": "10" }, { "name": "随州", "value": "11" }, { "name": "荆州", "value": "12" }, { "name": "黄冈", "value": "13" }, { "name": "孝感", "value": "14" }] }, "yn": { "name": "云南省", "children": [{ "name": "昆明", "value": "1" }, { "name": "曲靖", "value": "2" }] }, "ln": { "name": "辽宁省", "children": [{ "name": "沈阳", "value": "1" }, { "name": "大连", "value": "2" }, { "name": "鞍山", "value": "3" }, { "name": "抚顺", "value": "4" }, { "name": "本溪", "value": "5" }] }, "hl": { "name": "黑龙江", "children": [{ "name": "哈尔滨", "value": "1" }, { "name": "齐齐哈尔", "value": "2" }, { "name": "佳木斯", "value": "3" }] }, "sjz": { "name": "河北", "children": [{ "name": "石家庄", "value": "1" }, { "name": "保定", "value": "2" }, { "name": "邯郸", "value": "3" }, { "name": "廊坊", "value": "4" }] } }


let hand = function (task) {	// 这个函数必须返回promise，不管异步还是同步
	return fetch(task.url).then(text => {
		const $ = cheerio.load(text)
		let temp = $("body > div.Main > div.right > div.filterContent > div.filterfl")
		temp = temp.children().filter((index, item) => {
			item = $(item)
			return item.text().includes("默认套餐") || item.text().includes("资费套餐")
		})
		wrapper = temp.find("dd>ul>li")
		let str = ""
		wrapper.children().each((index, item) => {
			item = $(item)
			if (item.hasClass("dhsttl")) {
				return true
			}
			const temp = `${item.attr("href")}`
			str += `\t{ value: ${temp.match(/zifei=(\d+)/, "$1")[1]}, `
			str += `name: "${item.text()}" },\r\n`
		})
		let url = new URL(task.url)
		let prov = url.host.replace(/\..*/, "")
		let isSpecial = areas[prov].isSpecial
		let city = url.searchParams.get("dis")
		let result = `"${prov}${isSpecial ? "" : ("." + city)}.${task.phase.tsp}": [\r\n${str}\r\n],\r\n`
		utils.appendFile(result, path.resolve(__dirname, "../bin/data/pkgs.js"))
	}).catch(e => {
		let url = new URL(task.url)
		let prov = url.host.replace(/\..*/, "")
		let isSpecial = areas[prov].isSpecial
		let city = url.searchParams.get("dis")
		let result = `"${prov}${isSpecial ? "" : ("." + city)}.${task.phase.tsp}": [\r\n\r\n],\r\n`
		utils.appendFile(result, path.resolve(__dirname, "../bin/data/pkgs.js"))
		//throw e
	})
}

let lastPlan = Promise.resolve()
for (let provCode in areas) {
	let taskInterval = 1.3
	let item = areas[provCode]
	if (item.isSpecial) {
		let plan = {
			name: `${provCode}`,
			urlTemplate: `http://${provCode}.tiaohao.com/{tsp}/`,
			urlPhases: {
				tsp: {
					type: perloin.type.iterating,
					set: tsp.map(item => item.value)
				},
			},
			interval: taskInterval,
			execute: hand,
		}
		lastPlan = lastPlan.then(() => perloin.run(plan))
	} else {
		areas[provCode].children.forEach(city => {
			let plan = {
				name: `${provCode}.${city.name}`,
				urlTemplate: `http://${provCode}.tiaohao.com/{tsp}/?dis=${city.value}`,
				urlPhases: {
					tsp: {
						type: perloin.type.iterating,
						set: tsp.map(item => item.value)
					},
				},
				interval: taskInterval,
				execute: hand,
			}
			lastPlan = lastPlan.then(() => perloin.run(plan))
		})
	}
}

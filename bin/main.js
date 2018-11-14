#!/usr/bin/env node

const inquirer = require('inquirer')
const area = require("./data/area.js")
const tsps = require("./data/tsp.js")
const pkgs = require("./data/pkgs.js")

const { version } = require('../package.json')
console.log(`\r\n[numh][version]: ${version}\r\n`)

let provs = []
for (let key in area) {
	provs.push({
		value: key,
		name: area[key].name,
	})
}

inquirer.prompt([
	{
		name: 'service',
		type: 'list',
		message: '选择服务：',
		choices: [{ value: "th", name: "挑号网" }, { value: "nine", name: "9元" }, { value: "king", name: "王卡" }],
		default: "th",
	},
	{
		name: 'province',
		type: 'list',
		message: '选择省份：',
		choices: provs,
		default: "sz",
		when: (answers) => {
			return answers.service === "th"
		},
	},
	{
		name: 'city',
		type: 'list',
		message: '选择城市：',
		choices: (answers) => {
			return area[answers.province || "gd"].children
		},
		when: (answers) => {
			answers.isSpecial = area[answers.province || "gd"].isSpecial
			return !answers.isSpecial
		},
		default: 0,
	},
	{
		name: 'tsp',
		type: 'list',
		message: '选择卡类：',
		choices: tsps,
		default: 0,
		when: (answers) => {
			return answers.service === "th"
		},
	},
	{
		name: 'package',
		type: 'list',
		message: '选择套餐：',
		choices: (answers) => {
			let key = `${answers.province}${answers.isSpecial ? "" : ("." + answers.city)}.${answers.tsp}`
			return pkgs[key]
		},
		when: (answers) => {
			if (answers.service !== "th") {
				return false
			}
			let key = `${answers.province}${answers.isSpecial ? "" : ("." + answers.city)}.${answers.tsp}`
			if (!pkgs[key] || !pkgs[key].length) {
				return false
			}
			return true
		},
	},
	{
		name: 'price',
		type: 'list',
		message: '选择价格区间：',
		choices: (answers) => {
			return [
				{ name: "全部", value: -1 }, 
				{ name: "0-200", value: "1st" }, 
				{ name: "200-500", value: "2st" }, 
				{ name: "500-1000", value: "3st" }, 
				{ name: "1000-2000", value: "4st" }, 
				{ name: "2000-5000", value: "5st" }, 
				{ name: "5000-10000", value: "6st" }, 
				{ name: "10000以上", value: "8st" }, 
			]
		},
		default: -1
	},
	{
		name: 'interval',
		type: 'input',
		message: '任务间隔时间（秒）：',
		default: 1.2,
		validate: (value) => /^[\d\.]*\d$/.test(value),
		filter: (value) => +value,
	},
	{
		name: 'confirm',
		type: 'confirm',
		message: () => {
			return `是否继续？`
		},
		default: true,
	},
]).catch(e => {
	console.error(`[numh][inquirer]: error occurred when selecting menu:`, e)
	process.exit()
}).then(answers => {
	if (!answers.confirm) {
		return process.exit()
	}
	return require("../bootstrap.js").boot(answers)
}).catch(e => {
	console.error(`[numh]: error occurred when executing the plan:`, e)
	process.exit()
})

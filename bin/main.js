#!/usr/bin/env node

const inquirer = require('inquirer')
const area = require("./data/area.js")
const tsps = require("./data/tsp.js")
const pkgs = require("./data/pkgs.js")

const { version } = require('../package.json')
console.log(`\r\n[numh][version]: ${version}\r\n`)

let provs = []
for(let key in area){
	provs.push({
		value: key,
		name: area[key].name,
	})
}

inquirer.prompt([
	{
		name: 'province',
		type: 'list',
		message: '选择省份：',
		choices: provs,
		default: "gd",
	},
	{
		name: 'city',
		type: 'list',
		message: '选择城市：',
		choices: (answers) => {
			return area[answers.province].children
		},
		when: (answers)=>{
			answers.isSpecial = area[answers.province].isSpecial
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
	},
	{
		name: 'package',
		type: 'list',
		message: '选择套餐：',
		choices: (answers)=>{
			let key = `${answers.province}${answers.isSpecial ? "" : ("." + answers.city)}.${answers.tsp}`
			return pkgs[key]
		},
		when: (answers) => {
			let key = `${answers.province}${answers.isSpecial ? "" : ("." + answers.city)}.${answers.tsp}`
			if (!pkgs[key] || !pkgs[key].length) {
				return false
			}
			return true
		},
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

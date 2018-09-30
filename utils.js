const path = require("path")
const fs = require("fs")
const mkdirp = require('mkdirp')

const getQandR = (dividend, divisor) => {
	let remainder = dividend % divisor
	let quotient = (dividend - remainder) / divisor
	return [quotient, remainder]
}

const formatTimeRange = (range) => {
	let delta = Math.max((+range) * 1000, 0)
	let temp = getQandR(delta, (1000 * 60 * 60 * 24))
	let days = Math.floor(temp[0])
	temp = getQandR(temp[1], (1000 * 60 * 60))
	let hours = Math.floor(temp[0])
	temp = getQandR(temp[1], (1000 * 60))
	let minutes = Math.floor(temp[0])
	temp = getQandR(temp[1], (1000))
	let seconds = Math.floor(temp[0])
	let result = ""
	if (days) {
		result += days + "天"
		if (hours) {
			result += hours + "小时"
		}
		return result
	}
	if (hours) {
		result += hours + "小时"
		if (minutes) {
			result += minutes + "分钟"
		}
		return result
	}
	if (minutes) {
		result += minutes + "分钟"
		if (seconds) {
			result += seconds + "秒"
		}
		return result
	}
	return seconds + "秒"
}

const appendFile = (str, file) => {
	ensurePath(path.resolve(file, "../"))
	fs.appendFile(file, str, "utf8", (err) => {
		if (err) throw err
	})
}

const ensurePath = (destination) => {
	mkdirp(destination, function (err) {
		if (err) {
			throw err
		}
	})
}

module.exports = {
	formatTimeRange,
	appendFile
}

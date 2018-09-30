/* 
	2(r), 3(r), 4(r), 5(b), 6(b), 7(b), 8(b)
	red-black blocks is a data structure which respects the following rules:
	1. it consists of several balls, the balls are of two kinds of colors, which are red and black.
	2. the left part of the balls must be red, while the right part must be black.

	Every ball represents a number. The numbers from left to right form a series of consecutive/continuous natural numbers.
	This tiny lib helps with finding the border of the two parts. It takes three parameters, which are "min" "max" and "check."
*/


const getMiddle = (min, max) => {
	if (max - min < 2) {
		throw new Error(`[rbb]: can't find a mean value between ${min} and ${max}`)
	}
	return min + Math.floor((max - min) / 2)
}

const findBorder = async (min, max, isRed) => {	//min will definetly be red, and max will definitly be black
	if (max - min === 1) {
		return min
	}
	let middle = getMiddle(min, max)
	let resultMiddle = await isRed(middle)
	if (resultMiddle) {
		return await findBorder(middle, max, isRed)
	}
	return await findBorder(min, middle, isRed)
}

const examine = async (min, max, isRed) => {
	const minResult = await isRed(min)
	const maxResult = await isRed(max)
	if (!minResult) {
		return min - 1
	}
	if (maxResult) {
		return max
	}
	return await findBorder(min, max, isRed)
}

const find = async (min, max, func) => {
	console.log(`[rbb]: detecting border, from ${min} to ${max}`)
	let result = await examine(min, max, func)
	console.log(`[rbb]: the border is ${result}`)
	return result
}


module.exports = {
	find
}

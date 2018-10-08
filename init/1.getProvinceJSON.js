/* global $ */

// it should be executed in browser, it's written in jquery

let provs = {}

let wrapper = $("div.w_middle")
wrapper.children().each(function (index, item) {
	item = $(item)
	if (index === 0) {	// 直辖市
		item.children().each(function (index, item) {
			if (index === 0) {
				return null
			}
			item = $(item)
			let matched = item.children().eq(0).attr("href").match(/\/\/(\w+)\.tiaohao/, "$1")
			provs[matched[1]] = {
				name: item.text(),
				// children: [],
				isSpecial: true
			}
		})
		return null
	}
	let children = item.children()
	let provName = children.eq(0).text()
	let code = children.eq(1).children().eq(0).attr("href").match(/\/\/(\w+)\.tiaohao/, "$1")[1]
	provs[code] = {
		name: provName,
		children: []
	}
	children.each(function (index, item) {
		if (index === 0) {
			return null
		}
		item = $(item)
		let matched = item.children().eq(0).attr("href").match(/dis=(\d+)/)	///^http:\/\/(\w{2,6})\..*dis=(\d+)/
		if (!matched || !matched[1]) {	//直辖市出现在省里面
			return null
		}
		let city = {
			name: item.text(),
			value: matched[1]
		}
		provs[code].children.push(city)
	})

})
console.log(JSON.stringify(provs))

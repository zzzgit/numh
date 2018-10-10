let xl = require('excel4node')


module.exports = {
	init() {
		let wb = new xl.Workbook()
		let ws = wb.addWorksheet('Sheet 1')
		let style = wb.createStyle({
			font: {
				color: '#FF0800',
				size: 12,
			},
			numberFormat: '$#,##0.00; ($#,##0.00); -',
		})
		ws.column(1).setWidth(20)
		return { wb, ws, style }
	},
	fill(arr, { wb, ws, style }) {
		arr.forEach((row, rowIndex) => {
			row.forEach((cell, cellIndex) => {
				ws.cell(rowIndex + 1, cellIndex + 1).string(cell)
			})
		})
	},
	write(path, { wb, ws, style }) {
		wb.write(path)
	}
}

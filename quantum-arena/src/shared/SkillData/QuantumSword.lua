-- สายย่อย: ดาบควอนตัม (สายใหญ่: อาวุธ)
return {
	Id = "QuantumSword",
	Category = "Weapon",
	DisplayName = "ดาบควอนตัม",
	Icon = "🗡",
	Color = Color3.fromHex("#00FFD5"),
	Description = "ดาบที่อยู่หลายที่ในเวลาเดียวกัน",
	Basic = {
		Name = "ฟันดาบ",
		Type = "MeleeCombo",
		Damage = { 10, 10, 16 }, Range = 8, Width = 8, Cooldown = 0.35,
	},
	Skills = {
		{
			Id = "SuperpositionSlash", Name = "ฟันแยกร่าง", Icon = "⚔",
			Description = "สร้างร่างควอนตัม 2 ร่างฟันพร้อมกันจาก 3 ทิศ",
			Damage = 15, Hits = 3, DamageText = "15×3", Cooldown = 9, Range = 10, Targeting = "Self",
		},
		{
			Id = "PhaseCut", Name = "ฟันข้ามมิติ", Icon = "🌌",
			Description = "ฟันทะลุกำแพงได้ เป็นเส้นตรงยาว 30",
			Damage = 35, DamageText = "35", Cooldown = 10, Range = 30, Targeting = "Direction",
			Width = 6,
		},
		{
			Id = "EntangleThrow", Name = "ปาดาบวาร์ป", Icon = "🎯",
			Description = "ปาดาบไป ถ้าโดนศัตรูจะวาร์ปไปหาทันที",
			Damage = 20, DamageText = "20", Cooldown = 8, Range = 55, Targeting = "Direction",
			Speed = 170,
		},
		{
			Id = "BladeStorm", Name = "พายุดาบ", Icon = "🌪",
			Description = "หมุนตัวพร้อมดาบลอยรอบตัว รัศมี 10 นาน 2.5 วิ",
			Damage = 8, DamageText = "8/0.3วิ", Cooldown = 15, Range = 0, Targeting = "Self",
			Radius = 10, Duration = 2.5, Tick = 0.3,
		},
		{
			Id = "QuantumWave", Name = "คลื่นพลังดาบ", Icon = "🌙",
			Description = "ปล่อยคลื่นพลังรูปพระจันทร์เสี้ยวไปข้างหน้า ระยะ 45",
			Damage = 30, DamageText = "30", Cooldown = 7, Range = 45, Targeting = "Direction",
			Speed = 110, Radius = 4.5,
		},
	},
}

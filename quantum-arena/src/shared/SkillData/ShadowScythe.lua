-- สายย่อย: เคียวเงา (สายใหญ่: อาวุธ)
return {
	Id = "ShadowScythe",
	Category = "Weapon",
	DisplayName = "เคียวเงา",
	Icon = "🌑",
	Color = Color3.fromHex("#4B0082"),
	Description = "ฟันกว้าง ดึงศัตรู ดูดเลือด และซ่อนตัวในเงา",
	Basic = {
		Name = "ฟันเคียว",
		Type = "MeleeCombo",
		Damage = { 13 }, Range = 10, Width = 13, Cooldown = 0.6,
	},
	Skills = {
		{
			Id = "ReapHook", Name = "เกี่ยวดึง", Icon = "🪝",
			Description = "ปาโซ่เงา ถ้าโดนจะดึงศัตรูมาหา + สตัน 0.4 วิ",
			Damage = 15, DamageText = "15", Cooldown = 9, Range = 45, Targeting = "Direction",
			Speed = 150, Stun = 0.4,
		},
		{
			Id = "DeathSpin", Name = "หมุนเคียว", Icon = "🌀",
			Description = "หมุนเคียว 360° รัศมี 12",
			Damage = 25, DamageText = "25", Cooldown = 8, Range = 0, Targeting = "Self", Radius = 12,
		},
		{
			Id = "SoulDrain", Name = "ดูดวิญญาณ", Icon = "💀",
			Description = "ฟันหนักที่ดูดเลือดคืนได้ 100% ของดาเมจ",
			Damage = 30, DamageText = "30", Cooldown = 12, Range = 11, Targeting = "Direction",
			Width = 10,
		},
		{
			Id = "CrescentReap", Name = "จันทร์เสี้ยวเงา", Icon = "🌘",
			Description = "ฟันส่งคลื่นจันทร์เสี้ยวสีดำ ระยะ 40 + ช้าลง 30% นาน 2 วิ",
			Damage = 32, DamageText = "32", Cooldown = 8, Range = 40, Targeting = "Direction",
			Speed = 100, Radius = 4.5, SlowPercent = 0.3, SlowDuration = 2,
		},
		{
			Id = "ShadowVeil", Name = "ร่างเงา", Icon = "🫥",
			Description = "ล่องหน 4 วิ การโจมตีครั้งแรกหลังจากนั้นแรงขึ้น 50%",
			DamageText = "+50%", Cooldown = 18, Range = 0, Targeting = "Self",
			Duration = 4, Bonus = 1.5, BonusWindow = 8,
		},
	},
}

-- สายย่อย: หมัดเทพ (สายใหญ่: ทักษะต่อสู้)
return {
	Id = "DivineFist",
	Category = "Combat",
	DisplayName = "หมัดเทพ",
	Icon = "👊",
	Color = Color3.fromHex("#FF8C00"),
	Description = "หมัดเร็วที่สุดในเกม ทุบ กระแทก และปัดป้อง",
	Basic = {
		Name = "ต่อย",
		Type = "MeleeCombo",
		Damage = { 7, 7, 7, 14 }, Range = 6, Width = 6, Cooldown = 0.22,
	},
	Skills = {
		{
			Id = "ShockwavePunch", Name = "หมัดคลื่นกระแทก", Icon = "💨",
			Description = "หมัดส่งคลื่นลมไปข้างหน้า ระยะ 30 + กระเด็นแรง",
			Damage = 30, DamageText = "30", Cooldown = 7, Range = 30, Targeting = "Direction",
			Speed = 130, Radius = 4, Knockback = 75,
		},
		{
			Id = "HundredFists", Name = "คอมโบเทพ", Icon = "🥊",
			Description = "รัวหมัด 10 ครั้งใน 1.5 วิ ใส่ศัตรูข้างหน้า",
			Damage = 4, Hits = 10, DamageText = "4×10", Cooldown = 11, Range = 8, Targeting = "Direction",
			Duration = 1.5, Width = 7,
		},
		{
			Id = "SkyUppercut", Name = "อัปเปอร์คัต", Icon = "⤴",
			Description = "ส่งศัตรูลอย 1 วิ ตัวเองกระโดดตามขึ้นไป",
			Damage = 25, DamageText = "25", Cooldown = 9, Range = 8, Targeting = "Direction",
			Width = 7, Airborne = 1,
		},
		{
			Id = "GroundSlam", Name = "ทุบพื้น", Icon = "🌋",
			Description = "กระโดดขึ้นแล้วทุบลง รัศมี 14 + สตัน 0.6 วิ",
			Damage = 35, DamageText = "35", Cooldown = 13, Range = 0, Targeting = "Self",
			Radius = 14, Stun = 0.6,
		},
		{
			Id = "PerfectParry", Name = "ปัดป้อง", Icon = "🤚",
			Description = "ตั้งรับ 0.5 วิ ถ้าโดนตี = ไม่เสียเลือด + สวนกลับ 2 เท่า + สตันผู้ตี 1 วิ",
			DamageText = "×2 สวน", Cooldown = 10, Range = 0, Targeting = "Self",
			Duration = 0.5, Multiplier = 2, Stun = 1,
		},
	},
}

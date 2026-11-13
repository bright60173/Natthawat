-- สายย่อย: นินจา (สายใหญ่: ทักษะต่อสู้)
return {
	Id = "Ninja",
	Category = "Combat",
	DisplayName = "นินจา",
	Icon = "🥷",
	Color = Color3.fromHex("#2E8B57"),
	Description = "ว่องไว ลอบโจมตี กระโดดได้ 2 ครั้ง (ความสามารถติดตัว)",
	DoubleJump = true,
	Basic = {
		Name = "ฟันมีดสั้น",
		Type = "MeleeCombo",
		Damage = { 8 }, Range = 7, Width = 6, Cooldown = 0.28,
	},
	Skills = {
		{
			Id = "ShadowDash", Name = "ก้าวเงา", Icon = "💨",
			Description = "พุ่งไปข้างหน้า 30 ทำดาเมจทุกคนที่ผ่าน",
			Damage = 15, DamageText = "15", Cooldown = 5, Range = 30, Targeting = "Direction",
			Width = 7,
		},
		{
			Id = "ShurikenFan", Name = "ดาวกระจาย", Icon = "✴",
			Description = "ปาดาวกระจาย 5 ดวงเป็นรูปพัด",
			Damage = 10, Hits = 5, DamageText = "10×5", Cooldown = 7, Range = 45, Targeting = "Direction",
			Speed = 130, SpreadAngle = 10,
		},
		{
			Id = "CloneJutsu", Name = "แยกร่าง", Icon = "👥",
			Description = "สร้างร่างปลอม 2 ร่างวิ่งไปคนละทาง อยู่ 5 วิ (โดนตีครั้งเดียวหาย)",
			DamageText = "–", Cooldown = 16, Range = 0, Targeting = "Direction", Duration = 5,
		},
		{
			Id = "Backstab", Name = "ลอบสังหาร", Icon = "🗡",
			Description = "วาร์ปไปหลังศัตรูในระยะ 30 ที่เล็งอยู่แล้วแทง ถ้าเป้าไม่ได้หันมาทางเรา ดาเมจ 2 เท่า",
			Damage = 25, DamageText = "25 / 50", Cooldown = 10, Range = 30, Targeting = "Target",
		},
		{
			Id = "SmokeBomb", Name = "ระเบิดควัน", Icon = "🌫",
			Description = "ควันรัศมี 15 นาน 5 วิ คนในควันมองไม่เห็นชื่อ/แถบเลือด เราล่องหนเมื่ออยู่ในควัน",
			DamageText = "–", Cooldown = 14, Range = 0, Targeting = "Self",
			Radius = 15, Duration = 5,
		},
	},
}

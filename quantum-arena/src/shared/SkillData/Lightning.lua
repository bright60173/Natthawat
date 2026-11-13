-- สายย่อย: สายฟ้า (สายใหญ่: พลัง)
return {
	Id = "Lightning",
	Category = "Power",
	DisplayName = "สายฟ้า",
	Icon = "⚡",
	Color = Color3.fromHex("#00BFFF"),
	Description = "รวดเร็วและรุนแรง ช็อตศัตรูหลายคนพร้อมกัน",
	Basic = {
		Name = "ช็อตสายฟ้า",
		Type = "Hitscan",
		Damage = 9, Range = 40, Cooldown = 0.45, Radius = 1.2,
	},
	Skills = {
		{
			Id = "Bolt", Name = "หอกสายฟ้า", Icon = "🔱",
			Description = "ยิงตรงเร็วมาก ทะลุคนแรกได้",
			Damage = 30, DamageText = "30", Cooldown = 6, Range = 90, Targeting = "Direction",
			Speed = 320, Pierce = 1,
		},
		{
			Id = "FlashStep", Name = "พุ่งสายฟ้า", Icon = "💫",
			Description = "พุ่ง 35 studs ทำดาเมจทุกคนที่ผ่าน",
			Damage = 20, DamageText = "20", Cooldown = 8, Range = 35, Targeting = "Direction",
			Width = 7,
		},
		{
			Id = "ThunderStrike", Name = "ฟ้าผ่า", Icon = "🌩",
			Description = "วงเตือนที่จุดเล็งรัศมี 10 ผ่าหลัง 0.8 วิ + สตัน 0.5 วิ",
			Damage = 40, DamageText = "40", Cooldown = 12, Range = 55, Targeting = "Point",
			Radius = 10, Delay = 0.8, Stun = 0.5,
		},
		{
			Id = "StaticShield", Name = "โล่ไฟฟ้า", Icon = "🛡",
			Description = "โล่ 50 นาน 4 วิ ใครตีใส่โดนช็อตกลับ 10",
			Damage = 10, DamageText = "10 สะท้อน", Cooldown = 16, Range = 0, Targeting = "Self",
			Shield = 50, Duration = 4,
		},
		{
			Id = "ChainLightning", Name = "สายฟ้าลูกโซ่", Icon = "🔗",
			Description = "โดนเป้าแรกแล้วกระโดดไปอีก 3 คนในระยะ 20 ดาเมจลดลง 20% ต่อการกระโดด",
			Damage = 22, DamageText = "22", Cooldown = 10, Range = 45, Targeting = "Direction",
			Jumps = 3, JumpRange = 20, Falloff = 0.8,
		},
	},
}

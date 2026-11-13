-- สายย่อย: มิติ (สายใหญ่: พลัง)
return {
	Id = "Dimension",
	Category = "Power",
	DisplayName = "มิติ",
	Icon = "🌀",
	Color = Color3.fromHex("#8A2BE2"),
	Description = "บิดพื้นที่ วาร์ป เปิดประตูมิติ และสร้างหลุมดำ",
	Basic = {
		Name = "ลูกพลังมิติ",
		Type = "Projectile",
		Damage = 8, Range = 60, Cooldown = 0.3, Speed = 140, Radius = 1,
	},
	Skills = {
		{
			Id = "Blink", Name = "วาร์ป", Icon = "✨",
			Description = "วาร์ปไปตามทิศที่เล็ง สูงสุด 40 studs (ไม่ทะลุกำแพง)",
			DamageText = "–", Cooldown = 5, Range = 40, Targeting = "Direction",
		},
		{
			Id = "Portal", Name = "ประตูมิติ", Icon = "🚪",
			Description = "วางประตู 2 บาน (ตรงหน้า + จุดที่เล็ง) อยู่ 8 วิ ใครก็เดินผ่านได้",
			DamageText = "–", Cooldown = 14, Range = 70, Targeting = "Point", Duration = 8,
		},
		{
			Id = "BlackHole", Name = "หลุมดำ", Icon = "⚫",
			Description = "ทรงกลมรัศมี 15 ดูดศัตรูเข้ากลาง 3 วิ",
			Damage = 6, DamageText = "6/0.5วิ", Cooldown = 16, Range = 50, Targeting = "Point",
			Radius = 15, Duration = 3, Tick = 0.5,
		},
		{
			Id = "SpaceRift", Name = "ฉีกพื้นที่", Icon = "⚡",
			Description = "รอยแยกเส้นตรงยาว 50 ระเบิดหลังดีเลย์ 0.6 วิ",
			Damage = 35, DamageText = "35", Cooldown = 9, Range = 50, Targeting = "Direction",
			Width = 6, Delay = 0.6,
		},
		{
			Id = "PhaseShift", Name = "หลบเข้ามิติ", Icon = "👻",
			Description = "อมตะและทะลุตัวคนอื่นได้ 2 วิ แต่โจมตีไม่ได้",
			DamageText = "–", Cooldown = 18, Range = 0, Targeting = "Self", Duration = 2,
		},
	},
}

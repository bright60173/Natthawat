-- สายย่อย: เวลา (สายใหญ่: พลัง)
return {
	Id = "Time",
	Category = "Power",
	DisplayName = "เวลา",
	Icon = "⏳",
	Color = Color3.fromHex("#FFD700"),
	Description = "หยุด ย้อน และเร่งเวลา ควบคุมจังหวะการต่อสู้",
	Basic = {
		Name = "เข็มนาฬิกา",
		Type = "Spread",
		Damage = 5, Range = 50, Cooldown = 0.5, Speed = 130, Radius = 0.6,
		Count = 3, SpreadAngle = 8,
	},
	Skills = {
		{
			Id = "TimeStop", Name = "หยุดเวลา", Icon = "⏸",
			Description = "ศัตรูในรัศมี 20 ถูกหยุดเวลา 2 วิ",
			DamageText = "–", Cooldown = 22, Range = 0, Targeting = "Self",
			Radius = 20, Duration = 2,
		},
		{
			Id = "Rewind", Name = "ย้อนเวลา", Icon = "⏪",
			Description = "กลับไปที่ตำแหน่งและเลือดเมื่อ 3 วิก่อน",
			DamageText = "–", Cooldown = 15, Range = 0, Targeting = "Self", Seconds = 3,
		},
		{
			Id = "Haste", Name = "เร่งเวลา", Icon = "⏩",
			Description = "เร็วขึ้น 60% และคูลดาวน์ลดเร็วขึ้น 2 เท่า นาน 4 วิ",
			DamageText = "–", Cooldown = 12, Range = 0, Targeting = "Self",
			Duration = 4, SpeedBonus = 0.6,
		},
		{
			Id = "SlowField", Name = "หน่วงเวลา", Icon = "🕸",
			Description = "ทรงกลมรัศมี 18 ศัตรูข้างในช้าลง 50% นาน 4 วิ",
			DamageText = "–", Cooldown = 13, Range = 45, Targeting = "Point",
			Radius = 18, Duration = 4, SlowPercent = 0.5,
		},
		{
			Id = "TimeBomb", Name = "ระเบิดเวลา", Icon = "💣",
			Description = "ติดระเบิดบนศัตรูตัวแรกที่โดน ระเบิดหลัง 2.5 วิ",
			Damage = 45, DamageText = "45", Cooldown = 11, Range = 60, Targeting = "Direction",
			Delay = 2.5, Radius = 8, Speed = 120,
		},
	},
}

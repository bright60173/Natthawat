-- ค่าคงที่ทั้งหมดของเกม (แก้สมดุลเกมได้ที่ไฟล์นี้)
local Config = {}

Config.MaxHealth = 150
Config.WalkSpeed = 18
Config.JumpPower = 50

Config.Dash = {
	Distance = 25,
	Cooldown = 3,
	IFrame = 0.2,
	Duration = 0.15,
}

Config.RespawnTime = 4
Config.SpawnProtection = 3
Config.Regen = { Rate = 3, Delay = 6 }
Config.KillHeal = 30
Config.AssistWindow = 5

Config.Stun = { MaxDuration = 2, ResistAfter = 1 }

Config.RemoteRateLimit = 20 -- ครั้ง/วินาที ต่อผู้เล่น
Config.ReturnToLobbyCombatDelay = 5 -- ต้องไม่โดนตีกี่วิถึงกลับ Lobby ได้

Config.KillFeed = { MaxLines = 5, Lifetime = 6 }
Config.Streaks = {
	[5] = "กำลังอาละวาด!",
	[10] = "หยุดไม่อยู่!",
}

Config.Lobby = {
	Center = Vector3.new(0, 300, 0),
	Size = 80,
	SafeY = 200, -- สูงกว่านี้ถือว่าอยู่ใน Lobby (ตีกันไม่ได้)
}

Config.Arena = {
	Radius = 150,
	KillY = -50,
	SpawnRadius = 135,
	SpawnCount = 8,
}

Config.DefaultLoadout = {
	Subclass = "QuantumSword",
	Skills = { "SuperpositionSlash", "EntangleThrow", "QuantumWave" },
}

Config.DataStoreName = "QuantumArenaLoadout_v1"

-- ชื่อ collision group
Config.Groups = { Players = "QA_Players", Phased = "QA_Phased" }

return Config

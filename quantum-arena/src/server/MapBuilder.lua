-- สร้างแผนที่ทั้งหมดด้วยโค้ดตอนเริ่มเซิร์ฟเวอร์ (ไม่ใช้ asset จาก Toolbox)
local CollectionService = game:GetService("CollectionService")
local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local CombatService = require(script.Parent.CombatService)
local StatusService = require(script.Parent.StatusService)

local MapBuilder = {}

local FLOOR_COLOR = Color3.fromRGB(34, 36, 46)
local WALL_COLOR = Color3.fromRGB(48, 52, 66)
local NEON_CYAN = Color3.fromRGB(0, 200, 255)
local NEON_PINK = Color3.fromRGB(255, 60, 200)
local NEON_ORANGE = Color3.fromRGB(255, 150, 40)
local NEON_GREEN = Color3.fromRGB(80, 255, 140)

local function folder(name, parent)
	local existing = parent:FindFirstChild(name)
	if existing then
		return existing
	end
	local f = Instance.new("Folder")
	f.Name = name
	f.Parent = parent
	return f
end

local function make(parent, props)
	local part = Instance.new("Part")
	part.Anchored = true
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.Material = Enum.Material.SmoothPlastic
	for key, value in pairs(props) do
		part[key] = value
	end
	part.Parent = parent
	return part
end

-- ชิ้นตกแต่งนีออน: ไม่ชน ไม่รับ raycast
local function neon(parent, props)
	props.Material = Enum.Material.Neon
	props.CanCollide = false
	props.CanQuery = false
	props.CanTouch = false
	props.CastShadow = false
	return make(parent, props)
end

-- แผ่นกลมแนวนอน (Cylinder หมุนให้แกนตั้ง)
local function disc(parent, position, radius, height, props)
	props = props or {}
	props.Shape = Enum.PartType.Cylinder
	props.Size = Vector3.new(height, radius * 2, radius * 2)
	props.CFrame = CFrame.new(position) * CFrame.Angles(0, 0, math.rad(90))
	return make(parent, props)
end

local function polar(radius, degrees, y)
	local rad = math.rad(degrees)
	return Vector3.new(math.cos(rad) * radius, y or 0, math.sin(rad) * radius)
end

local function light(parent, color, range, brightness)
	local l = Instance.new("PointLight")
	l.Color = color
	l.Range = range
	l.Brightness = brightness or 1.5
	l.Parent = parent
	return l
end

---------------------------------------------------------------------------
-- แสง
---------------------------------------------------------------------------
local function buildLighting()
	Lighting.ClockTime = 0
	Lighting.Brightness = 1.5
	Lighting.Ambient = Color3.fromRGB(95, 95, 120)
	Lighting.OutdoorAmbient = Color3.fromRGB(80, 80, 110)
	Lighting.EnvironmentDiffuseScale = 0.4
	Lighting.EnvironmentSpecularScale = 0.6

	for _, child in ipairs(Lighting:GetChildren()) do
		if child:IsA("PostEffect") or child:IsA("Atmosphere") then
			child:Destroy()
		end
	end

	local atmosphere = Instance.new("Atmosphere")
	atmosphere.Density = 0.28
	atmosphere.Offset = 0.2
	atmosphere.Color = Color3.fromRGB(90, 80, 160)
	atmosphere.Decay = Color3.fromRGB(30, 20, 70)
	atmosphere.Glare = 0
	atmosphere.Haze = 1.2
	atmosphere.Parent = Lighting

	local bloom = Instance.new("BloomEffect")
	bloom.Intensity = 0.9
	bloom.Size = 28
	bloom.Threshold = 0.9
	bloom.Parent = Lighting

	local color = Instance.new("ColorCorrectionEffect")
	color.Contrast = 0.15
	color.Saturation = 0.2
	color.TintColor = Color3.fromRGB(235, 235, 255)
	color.Parent = Lighting
end

---------------------------------------------------------------------------
-- Lobby (แท่นลอย ปลอดภัย ตีกันไม่ได้)
---------------------------------------------------------------------------
local function buildLobby(map)
	local lobby = folder("Lobby", map)
	local center = Config.Lobby.Center
	local size = Config.Lobby.Size
	local half = size / 2

	make(lobby, {
		Name = "Floor",
		Size = Vector3.new(size, 2, size),
		Position = center - Vector3.new(0, 1, 0),
		Color = FLOOR_COLOR,
		Material = Enum.Material.Metal,
	})

	-- เส้นนีออนขอบพื้น + กำแพงกระจกกันตก
	for _, side in ipairs({
		{ Vector3.new(0, 0, half), Vector3.new(size, 0.3, 0.6), Vector3.new(size, 16, 1) },
		{ Vector3.new(0, 0, -half), Vector3.new(size, 0.3, 0.6), Vector3.new(size, 16, 1) },
		{ Vector3.new(half, 0, 0), Vector3.new(0.6, 0.3, size), Vector3.new(1, 16, size) },
		{ Vector3.new(-half, 0, 0), Vector3.new(0.6, 0.3, size), Vector3.new(1, 16, size) },
	}) do
		neon(lobby, { Name = "Edge", Size = side[2], Position = center + side[1] + Vector3.new(0, 0.1, 0), Color = NEON_CYAN })
		make(lobby, {
			Name = "Glass",
			Size = side[3],
			Position = center + side[1] + Vector3.new(0, 8, 0),
			Color = Color3.fromRGB(120, 200, 255),
			Material = Enum.Material.Glass,
			Transparency = 0.8,
		})
	end

	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "LobbySpawn"
	spawn.Anchored = true
	spawn.Neutral = true
	spawn.Duration = 0
	spawn.Size = Vector3.new(14, 1, 14)
	spawn.Position = center + Vector3.new(0, 0.5, 18)
	spawn.Material = Enum.Material.Neon
	spawn.Color = NEON_GREEN
	spawn.Transparency = 0.6
	spawn.TopSurface = Enum.SurfaceType.Smooth
	spawn.Parent = lobby

	-- ประตูนีออน: เดินเข้าไปเพื่อวาร์ปลงสนาม
	local gateZ = -half + 6
	neon(lobby, { Name = "GatePillar", Size = Vector3.new(1.5, 13, 1.5), Position = center + Vector3.new(-5.5, 6.5, gateZ), Color = NEON_PINK })
	neon(lobby, { Name = "GatePillar", Size = Vector3.new(1.5, 13, 1.5), Position = center + Vector3.new(5.5, 6.5, gateZ), Color = NEON_PINK })
	local top = neon(lobby, { Name = "GateTop", Size = Vector3.new(12.5, 1.5, 1.5), Position = center + Vector3.new(0, 13.5, gateZ), Color = NEON_PINK })
	light(top, NEON_PINK, 30, 2)

	local gate = make(lobby, {
		Name = "LobbyGate",
		Size = Vector3.new(9.5, 12.5, 1),
		Position = center + Vector3.new(0, 6.5, gateZ),
		Color = NEON_PINK,
		Material = Enum.Material.ForceField,
		Transparency = 0.3,
		CanCollide = false,
		CanQuery = false,
	})

	local gateGui = Instance.new("BillboardGui")
	gateGui.Size = UDim2.fromScale(14, 3)
	gateGui.StudsOffset = Vector3.new(0, 10, 0)
	gateGui.LightInfluence = 0
	gateGui.MaxDistance = 200
	local gateLabel = Instance.new("TextLabel")
	gateLabel.BackgroundTransparency = 1
	gateLabel.Size = UDim2.fromScale(1, 1)
	gateLabel.Font = Enum.Font.GothamBlack
	gateLabel.TextScaled = true
	gateLabel.TextColor3 = Color3.new(1, 1, 1)
	gateLabel.TextStrokeTransparency = 0.3
	gateLabel.Text = "⚔ ลงสนาม ⚔"
	gateLabel.Parent = gateGui
	gateGui.Parent = gate

	-- ป้ายบอกวิธีเล่น
	local sign = make(lobby, {
		Name = "HowToPlay",
		Size = Vector3.new(26, 14, 1),
		Position = center + Vector3.new(23, 8, gateZ),
		Color = Color3.fromRGB(18, 18, 28),
	})
	local surface = Instance.new("SurfaceGui")
	surface.Face = Enum.NormalId.Back
	surface.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	surface.PixelsPerStud = 30
	surface.LightInfluence = 0
	local text = Instance.new("TextLabel")
	text.BackgroundTransparency = 1
	text.Size = UDim2.fromScale(0.94, 0.94)
	text.Position = UDim2.fromScale(0.03, 0.03)
	text.Font = Enum.Font.GothamBold
	text.TextScaled = true
	text.TextColor3 = Color3.fromRGB(230, 240, 255)
	text.TextXAlignment = Enum.TextXAlignment.Left
	text.TextYAlignment = Enum.TextYAlignment.Top
	text.Text = table.concat({
		"วิธีเล่น QUANTUM ARENA",
		"",
		"1. เลือกสายใหญ่ → สายย่อย → สกิล 3 จาก 5",
		"2. กด \"ลงสนาม\" หรือเดินเข้าประตูนีออน",
		"3. คลิกซ้าย = โจมตี   Q / E / R = สกิล",
		"4. Shift = พุ่งหลบ   Tab = กลับมาเปลี่ยนสาย",
		"5. ฆ่าได้ฟื้นเลือด 30 HP — สู้ให้สนุก!",
	}, "\n")
	text.Parent = surface
	surface.Parent = sign

	-- ไฟส่องป้ายและไฟกลาง Lobby
	local frame = neon(lobby, { Name = "SignFrame", Size = Vector3.new(27, 0.5, 1.2), Position = sign.Position + Vector3.new(0, 7.2, 0), Color = NEON_CYAN })
	light(frame, NEON_CYAN, 24, 1.5)
	local centerLight = neon(lobby, { Name = "LobbyLight", Size = Vector3.new(4, 0.4, 4), Position = center + Vector3.new(0, 22, 0), Color = Color3.new(1, 1, 1), Transparency = 0.3 })
	light(centerLight, Color3.fromRGB(220, 220, 255), 60, 1.5)

	return gate
end

---------------------------------------------------------------------------
-- Arena
---------------------------------------------------------------------------
local function buildArena(map)
	local arena = folder("Arena", map)
	local radius = Config.Arena.Radius

	disc(arena, Vector3.new(0, -2, 0), radius, 4, { Name = "Floor", Color = FLOOR_COLOR, Material = Enum.Material.Metal })

	-- เส้นนีออนเป็นตาราง
	local gridFolder = folder("Grid", arena)
	local inner = radius - 2
	for offset = -120, 120, 30 do
		local halfLength = math.sqrt(inner * inner - offset * offset)
		neon(gridFolder, { Name = "GridX", Size = Vector3.new(0.35, 0.1, halfLength * 2), Position = Vector3.new(offset, 0.05, 0), Color = NEON_CYAN, Transparency = 0.35 })
		neon(gridFolder, { Name = "GridZ", Size = Vector3.new(halfLength * 2, 0.1, 0.35), Position = Vector3.new(0, 0.05, offset), Color = NEON_CYAN, Transparency = 0.35 })
	end

	-- ขอบสนาม: วงนีออน + กำแพงพลังงานล่องหน
	local segments = 40
	local segmentLength = 2 * math.pi * (radius + 1) / segments + 1
	for i = 1, segments do
		local angle = (i - 1) * 360 / segments
		local position = polar(radius - 0.5, angle, 0.3)
		neon(arena, {
			Name = "Rim",
			Size = Vector3.new(segmentLength, 0.6, 1),
			CFrame = CFrame.lookAt(position, Vector3.new(0, 0.3, 0)),
			Color = NEON_PINK,
		})
		local wallPos = polar(radius + 1, angle, 60)
		make(arena, {
			Name = "Barrier",
			Size = Vector3.new(segmentLength, 124, 2),
			CFrame = CFrame.lookAt(wallPos, Vector3.new(0, 60, 0)),
			Transparency = 1,
			CastShadow = false,
		})
	end

	-- กำแพงกำบังวงนอก 8 ชิ้น + เสาวงใน 8 ต้น (สมมาตร)
	for i = 0, 7 do
		local wallPos = polar(110, i * 45, 5.5)
		local wall = make(arena, {
			Name = "CoverWall",
			Size = Vector3.new(18, 11, 2.5),
			CFrame = CFrame.lookAt(wallPos, Vector3.new(0, 5.5, 0)),
			Color = WALL_COLOR,
			Material = Enum.Material.Metal,
		})
		neon(arena, {
			Name = "CoverTrim",
			Size = Vector3.new(18.2, 0.5, 2.7),
			CFrame = wall.CFrame * CFrame.new(0, 5.3, 0),
			Color = i % 2 == 0 and NEON_CYAN or NEON_PINK,
		})

		local pillarPos = polar(68, i * 45 + 22.5, 7)
		make(arena, {
			Name = "Pillar",
			Size = Vector3.new(5, 14, 5),
			CFrame = CFrame.lookAt(pillarPos, Vector3.new(0, 7, 0)),
			Color = WALL_COLOR,
			Material = Enum.Material.Metal,
		})
		local band = neon(arena, {
			Name = "PillarBand",
			Size = Vector3.new(5.3, 0.6, 5.3),
			CFrame = CFrame.lookAt(pillarPos + Vector3.new(0, 4, 0), Vector3.new(0, 11, 0)),
			Color = i % 2 == 0 and NEON_PINK or NEON_CYAN,
		})
		light(band, band.Color, 28, 1.2)
	end

	-- แท่นสูง 3 ระดับตรงกลาง
	local tiers = { { Radius = 30, Top = 4 }, { Radius = 20, Top = 8 }, { Radius = 10, Top = 12 } }
	for index, tier in ipairs(tiers) do
		disc(arena, Vector3.new(0, tier.Top - 2, 0), tier.Radius, 4, {
			Name = "Tier" .. index,
			Color = Color3.fromRGB(42 + index * 6, 46 + index * 6, 60 + index * 8),
			Material = Enum.Material.Metal,
		})
		local rim = disc(arena, Vector3.new(0, tier.Top - 0.12, 0), tier.Radius + 0.25, 0.2, {
			Name = "TierRim",
			Color = index == 3 and NEON_ORANGE or NEON_CYAN,
		})
		rim.Material = Enum.Material.Neon
		rim.CanCollide = false
		rim.CanQuery = false
		rim.CastShadow = false
	end
	local beacon = neon(arena, { Name = "Beacon", Size = Vector3.new(1, 0.3, 1), Position = Vector3.new(0, 12.2, 0), Color = NEON_ORANGE })
	light(beacon, NEON_ORANGE, 50, 2)

	-- ทางลาดขึ้นแท่น
	local function ramp(angle, bottomRadius, bottomY, topRadius, topY)
		local bottom = polar(bottomRadius, angle, bottomY)
		local top = polar(topRadius, angle, topY)
		local mid = (bottom + top) / 2
		make(arena, {
			Name = "Ramp",
			Size = Vector3.new(9, 1, (top - bottom).Magnitude + 1),
			CFrame = CFrame.lookAt(mid, top) * CFrame.new(0, -0.5, 0),
			Color = Color3.fromRGB(60, 64, 84),
			Material = Enum.Material.DiamondPlate,
		})
	end
	for i = 0, 3 do
		ramp(i * 90, 43, 0, 30, 4)
		ramp(i * 90 + 45, 30, 4, 20, 8)
		ramp(i * 90, 20, 8, 10, 12)
	end

	-- Jump pad 4 จุด ดีดขึ้นแท่นสูง
	local padDebounce = {}
	for i = 0, 3 do
		local angle = i * 90 + 45
		local position = polar(54, angle, 0.2)
		local pad = disc(arena, position, 4.5, 0.4, { Name = "JumpPad", Color = NEON_ORANGE, CanCollide = false })
		pad.Material = Enum.Material.Neon
		light(pad, NEON_ORANGE, 18, 1.5)
		local inward = -polar(1, angle, 0)
		pad.Touched:Connect(function(hit)
			local character = hit.Parent
			local humanoid = character and character:FindFirstChildOfClass("Humanoid")
			if not humanoid or humanoid.Health <= 0 or not character:FindFirstChild("HumanoidRootPart") then
				return
			end
			local now = os.clock()
			if padDebounce[character] and now - padDebounce[character] < 1 then
				return
			end
			padDebounce[character] = now
			if StatusService.CanAct(character) then
				StatusService.Push(character, inward * 45 + Vector3.new(0, 45, 0), 0.3)
			end
		end)
	end
	task.spawn(function()
		while true do
			task.wait(10)
			for character in pairs(padDebounce) do
				if not character.Parent then
					padDebounce[character] = nil
				end
			end
		end
	end)

	-- จุดเกิดในสนาม 8 จุดรอบขอบ
	local spawns = {}
	for i = 0, Config.Arena.SpawnCount - 1 do
		local angle = i * (360 / Config.Arena.SpawnCount) + 22.5
		local ground = polar(Config.Arena.SpawnRadius, angle, 0)
		table.insert(spawns, ground + Vector3.new(0, 4, 0))
		local marker = disc(arena, ground + Vector3.new(0, 0.1, 0), 4, 0.2, { Name = "SpawnPad", Color = NEON_GREEN, Transparency = 0.5, CanCollide = false })
		marker.Material = Enum.Material.Neon
		marker.CanQuery = false
		marker.CanTouch = false
	end

	return spawns
end

---------------------------------------------------------------------------
-- หุ่นซ้อม (ไว้ทดสอบสกิลคนเดียว)
---------------------------------------------------------------------------
local function buildDummies()
	local entities = folder("Entities", Workspace)
	for i = 0, 3 do
		local base = polar(88, i * 90, 0)
		local facing = CFrame.lookAt(base, Vector3.new(0, 0, 0))
		local model = Instance.new("Model")
		model.Name = "หุ่นซ้อม"

		local function piece(name, size, offset, color)
			return make(model, {
				Name = name,
				Size = size,
				CFrame = facing * CFrame.new(offset),
				Color = color,
				Material = Enum.Material.Metal,
			})
		end
		piece("Legs", Vector3.new(2, 2, 1), Vector3.new(0, 1, 0), Color3.fromRGB(60, 60, 75))
		local root = piece("HumanoidRootPart", Vector3.new(2, 2, 1), Vector3.new(0, 3, 0), Color3.fromRGB(200, 200, 210))
		local head = piece("Head", Vector3.new(1.4, 1.4, 1.4), Vector3.new(0, 4.7, 0), Color3.fromRGB(255, 200, 80))
		head.Shape = Enum.PartType.Ball
		model.PrimaryPart = root

		local humanoid = Instance.new("Humanoid")
		humanoid.RequiresNeck = false
		humanoid.BreakJointsOnDeath = false
		humanoid.MaxHealth = Config.MaxHealth
		humanoid.Health = Config.MaxHealth
		humanoid.DisplayName = "หุ่นซ้อม"
		humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOn
		humanoid.Parent = model

		model:SetAttribute("Dummy", true)
		CollectionService:AddTag(model, "QA_Combatant")
		model.Parent = entities
	end

	-- หุ่นซ้อมฟื้นเลือดเองเมื่อไม่โดนตี 4 วิ
	task.spawn(function()
		while true do
			task.wait(1)
			for _, model in ipairs(entities:GetChildren()) do
				if model:GetAttribute("Dummy") and os.clock() - CombatService.LastDamaged(model) > 4 then
					local humanoid = model:FindFirstChildOfClass("Humanoid")
					if humanoid then
						humanoid.Health = humanoid.MaxHealth
					end
				end
			end
		end
	end)
end

function MapBuilder.Build()
	local map = folder("Map", Workspace)
	folder("Effects", Workspace)
	buildLighting()
	local gate = buildLobby(map)
	local spawns = buildArena(map)
	buildDummies()
	return { ArenaSpawns = spawns, LobbyGate = gate }
end

return MapBuilder

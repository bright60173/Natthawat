-- เกิดใหม่, ป้องกันตอนเกิด, วาร์ป Lobby ↔ Arena, แถบเลือดเหนือหัว, อาวุธในมือ
local PhysicsService = game:GetService("PhysicsService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Classes = require(Shared:WaitForChild("Classes"))
local Remotes = require(Shared:WaitForChild("Remotes"))

local CombatService = require(script.Parent.CombatService)
local StatusService = require(script.Parent.StatusService)

local SpawnService = {}

local arenaSpawns = {} -- { Vector3 }
local enterCallbacks = {}

-- ลงทะเบียนฟังก์ชันที่จะถูกเรียกเมื่อผู้เล่นเข้าสนาม (ทั้งกดลงสนามและเกิดใหม่)
function SpawnService.OnEnterArena(callback)
	table.insert(enterCallbacks, callback)
end

local function subclassOf(player)
	return Classes.GetSubclass(player:GetAttribute("Subclass"))
end

---------------------------------------------------------------------------
-- แถบเลือดเหนือหัว
---------------------------------------------------------------------------
local function buildOverhead(player, character, humanoid)
	local head = character:WaitForChild("Head", 5)
	if not head then
		return
	end
	local gui = Instance.new("BillboardGui")
	gui.Name = "QA_Overhead"
	gui.Adornee = head
	gui.Size = UDim2.fromScale(5.5, 1.3)
	gui.StudsOffset = Vector3.new(0, 2.6, 0)
	gui.MaxDistance = 140
	gui.LightInfluence = 0
	gui.PlayerToHideFrom = player

	local name = Instance.new("TextLabel")
	name.Name = "PlayerName"
	name.BackgroundTransparency = 1
	name.Size = UDim2.fromScale(1, 0.58)
	name.Font = Enum.Font.GothamBold
	name.TextScaled = true
	name.TextStrokeTransparency = 0.4
	name.Text = player.DisplayName
	name.Parent = gui

	local back = Instance.new("Frame")
	back.Name = "Bar"
	back.AnchorPoint = Vector2.new(0.5, 1)
	back.Position = UDim2.fromScale(0.5, 0.95)
	back.Size = UDim2.fromScale(0.9, 0.26)
	back.BackgroundColor3 = Color3.fromRGB(20, 20, 28)
	back.BorderSizePixel = 0
	back.Parent = gui

	local fill = Instance.new("Frame")
	fill.Name = "Fill"
	fill.Size = UDim2.fromScale(1, 1)
	fill.BorderSizePixel = 0
	fill.Parent = back

	local function recolor()
		local sub = subclassOf(player)
		local color = sub and sub.Color or Color3.new(1, 1, 1)
		-- สีเข้มมาก (เช่นเคียวเงา) ให้สว่างขึ้นเพื่อให้อ่านออก
		local h, s, v = color:ToHSV()
		local bright = Color3.fromHSV(h, s * 0.8, math.max(v, 0.75))
		name.TextColor3 = bright
		fill.BackgroundColor3 = bright
	end
	recolor()
	local attrConn = player:GetAttributeChangedSignal("Subclass"):Connect(recolor)

	humanoid.HealthChanged:Connect(function(health)
		fill.Size = UDim2.fromScale(math.clamp(health / humanoid.MaxHealth, 0, 1), 1)
	end)
	gui.Destroying:Connect(function()
		attrConn:Disconnect()
	end)
	gui.Parent = head
end

---------------------------------------------------------------------------
-- อาวุธในมือ (สร้างจาก Part ล้วน)
---------------------------------------------------------------------------
local function weaponPart(size, color, material, shape)
	local part = Instance.new("Part")
	part.Size = size
	part.Color = color
	part.Material = material or Enum.Material.Neon
	part.Shape = shape or Enum.PartType.Block
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.Massless = true
	part.CastShadow = false
	return part
end

function SpawnService.AttachWeapon(player, character)
	local old = character:FindFirstChild("QA_Weapon")
	if old then
		old:Destroy()
	end
	local sub = subclassOf(player)
	if not sub then
		return
	end
	local hand = character:FindFirstChild("RightHand") or character:FindFirstChild("Right Arm")
	if not hand then
		return
	end
	local gripY = hand.Name == "Right Arm" and -1 or -0.15

	local model = Instance.new("Model")
	model.Name = "QA_Weapon"

	local pieces = {} -- { part, offset }
	local dark = Color3.fromRGB(30, 30, 40)
	if sub.Id == "QuantumSword" then
		table.insert(pieces, { weaponPart(Vector3.new(0.25, 0.5, 4.2), sub.Color), CFrame.new(0, gripY, -2.4) })
		table.insert(pieces, { weaponPart(Vector3.new(1.2, 0.3, 0.3), dark, Enum.Material.Metal), CFrame.new(0, gripY, -0.3) })
	elseif sub.Id == "EnergyGun" then
		table.insert(pieces, { weaponPart(Vector3.new(0.5, 0.7, 1.8), dark, Enum.Material.Metal), CFrame.new(0, gripY, -0.9) })
		table.insert(pieces, { weaponPart(Vector3.new(0.3, 0.3, 0.6), sub.Color), CFrame.new(0, gripY + 0.1, -2) })
	elseif sub.Id == "ShadowScythe" then
		table.insert(pieces, { weaponPart(Vector3.new(0.25, 0.25, 6), dark, Enum.Material.Metal), CFrame.new(0, gripY, -1.5) })
		table.insert(pieces, {
			weaponPart(Vector3.new(0.15, 2.8, 0.7), Color3.fromHex("#9B4DFF")),
			CFrame.new(0, gripY - 1.2, -4.3) * CFrame.Angles(math.rad(20), 0, 0),
		})
	elseif sub.Id == "Ninja" then
		table.insert(pieces, { weaponPart(Vector3.new(0.15, 0.3, 1.6), sub.Color), CFrame.new(0, gripY, -1) })
	else
		local orb = weaponPart(Vector3.new(1, 1, 1), sub.Color, Enum.Material.Neon, Enum.PartType.Ball)
		orb.Transparency = 0.35
		table.insert(pieces, { orb, CFrame.new(0, gripY - 0.2, 0) })
	end

	for _, piece in ipairs(pieces) do
		local part, offset = piece[1], piece[2]
		part.CFrame = hand.CFrame * offset
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = hand
		weld.Part1 = part
		weld.Parent = part
		part.Parent = model
	end
	model.Parent = character
end

---------------------------------------------------------------------------
-- จุดเกิด
---------------------------------------------------------------------------
local function pickArenaSpawn(player)
	local enemies = {}
	for _, other in ipairs(Players:GetPlayers()) do
		local character = other.Character
		if other ~= player and character and CombatService.IsAlive(character) and not CombatService.InLobby(character) then
			table.insert(enemies, character:GetPivot().Position)
		end
	end
	if #enemies == 0 then
		return arenaSpawns[math.random(1, #arenaSpawns)]
	end
	-- เลือกจุดที่ไกลจากศัตรูที่ใกล้ที่สุดมากที่สุด
	local best, bestScore
	for _, point in ipairs(arenaSpawns) do
		local nearest = math.huge
		for _, position in ipairs(enemies) do
			nearest = math.min(nearest, (position - point).Magnitude)
		end
		if not bestScore or nearest > bestScore then
			best, bestScore = point, nearest
		end
	end
	return best
end

local function placeInArena(player, character)
	local point = pickArenaSpawn(player)
	local lookAt = Vector3.new(0, point.Y, 0)
	StatusService.Clear(character)
	character:PivotTo(CFrame.lookAt(point, lookAt))
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if humanoid and humanoid.Health > 0 then
		humanoid.Health = humanoid.MaxHealth
	end
	StatusService.Apply(character, "SpawnProtect", Config.SpawnProtection)
	for _, callback in ipairs(enterCallbacks) do
		task.spawn(callback, player, character)
	end
end

-- ลงสนาม (จากปุ่ม "ลงสนาม" หรือประตูนีออนใน Lobby)
function SpawnService.Deploy(player)
	local character = player.Character
	if not character or not CombatService.IsAlive(character) then
		return false
	end
	player:SetAttribute("InArena", true)
	SpawnService.AttachWeapon(player, character)
	placeInArena(player, character)
	return true
end

function SpawnService.ReturnToLobby(player)
	local character = player.Character
	if not character or not CombatService.IsAlive(character) then
		return false
	end
	if not player:GetAttribute("InArena") then
		return false
	end
	local sinceHit = os.clock() - CombatService.LastDamaged(character)
	if sinceHit < Config.ReturnToLobbyCombatDelay then
		Remotes.SkillFeedback:FireClient(player, {
			Type = "Notice",
			Text = "กำลังต่อสู้อยู่ ยังกลับ Lobby ไม่ได้",
		})
		return false
	end
	player:SetAttribute("InArena", false)
	StatusService.Clear(character)
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid.Health = humanoid.MaxHealth
	end
	character:PivotTo(CFrame.new(Config.Lobby.Center + Vector3.new(0, 5, 0)))
	return true
end

---------------------------------------------------------------------------
-- ตั้งค่าตัวละครตอนเกิด
---------------------------------------------------------------------------
local function onCharacter(player, character)
	local humanoid = character:WaitForChild("Humanoid", 10)
	local root = character:WaitForChild("HumanoidRootPart", 10)
	if not humanoid or not root then
		return
	end

	humanoid.MaxHealth = Config.MaxHealth
	humanoid.Health = Config.MaxHealth
	humanoid.WalkSpeed = Config.WalkSpeed
	humanoid.UseJumpPower = true
	humanoid.JumpPower = Config.JumpPower
	humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None

	-- ปิดสคริปต์ฟื้นเลือดอัตโนมัติของ Roblox (เราฟื้นเลือดเองใน CombatService)
	task.spawn(function()
		local regen = character:WaitForChild("Health", 5)
		if regen and regen:IsA("Script") then
			regen:Destroy()
		end
	end)

	StatusService.SetCollisionGroup(character, Config.Groups.Players)
	character.DescendantAdded:Connect(function(descendant)
		if descendant:IsA("BasePart") and not StatusService.Has(character, "Phase") then
			descendant.CollisionGroup = Config.Groups.Players
		end
	end)

	task.spawn(buildOverhead, player, character, humanoid)

	humanoid.Died:Connect(function()
		StatusService.Clear(character)
		if player:GetAttribute("InArena") then
			CombatService.HandleDeath(player, character)
		end
	end)

	-- รอให้ตัวละครเข้า workspace เรียบร้อยก่อนย้ายตำแหน่ง
	if not character:IsDescendantOf(workspace) then
		character.AncestryChanged:Wait()
	end
	RunService.Heartbeat:Wait()
	RunService.Heartbeat:Wait()

	task.spawn(function()
		character:WaitForChild("RightHand", 3)
		if character.Parent then
			SpawnService.AttachWeapon(player, character)
		end
	end)

	if player:GetAttribute("InArena") then
		-- ตายแล้วเกิดใหม่: ใช้ชุดเดิม ลงสนามเลย
		placeInArena(player, character)
	end
end

local function onPlayer(player)
	player:SetAttribute("InArena", false)
	player.CharacterAdded:Connect(function(character)
		onCharacter(player, character)
	end)
	if player.Character then
		task.spawn(onCharacter, player, player.Character)
	end
	player:GetAttributeChangedSignal("Subclass"):Connect(function()
		if player.Character then
			SpawnService.AttachWeapon(player, player.Character)
		end
	end)
end

function SpawnService.Init(mapInfo)
	arenaSpawns = mapInfo.ArenaSpawns

	PhysicsService:RegisterCollisionGroup(Config.Groups.Players)
	PhysicsService:RegisterCollisionGroup(Config.Groups.Phased)
	PhysicsService:CollisionGroupSetCollidable(Config.Groups.Phased, Config.Groups.Players, false)
	PhysicsService:CollisionGroupSetCollidable(Config.Groups.Phased, Config.Groups.Phased, false)

	Players.RespawnTime = Config.RespawnTime
	Players.PlayerAdded:Connect(onPlayer)
	for _, player in ipairs(Players:GetPlayers()) do
		task.spawn(onPlayer, player)
	end

	-- ประตูนีออนใน Lobby: เดินเข้าไปเพื่อลงสนาม
	local debounce = {}
	mapInfo.LobbyGate.Touched:Connect(function(hit)
		local player = Players:GetPlayerFromCharacter(hit.Parent)
		if not player or player:GetAttribute("InArena") then
			return
		end
		local now = os.clock()
		if debounce[player] and now - debounce[player] < 1 then
			return
		end
		debounce[player] = now
		SpawnService.Deploy(player)
	end)
	Players.PlayerRemoving:Connect(function(player)
		debounce[player] = nil
	end)

	Remotes.ReturnToLobby.OnServerEvent:Connect(function(player)
		SpawnService.ReturnToLobby(player)
	end)

	-- ตกจากแมปแล้วตายทันที
	task.spawn(function()
		while true do
			task.wait(0.25)
			for _, player in ipairs(Players:GetPlayers()) do
				local character = player.Character
				local root = character and character:FindFirstChild("HumanoidRootPart")
				local humanoid = character and character:FindFirstChildOfClass("Humanoid")
				if root and humanoid and humanoid.Health > 0 and root.Position.Y < Config.Arena.KillY then
					humanoid.Health = 0
				end
			end
		end
	end)
end

return SpawnService

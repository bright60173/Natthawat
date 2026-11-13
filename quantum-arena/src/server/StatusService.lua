-- สถานะผิดปกติทั้งหมด: Stun / Slow / Knockback / Airborne / Frozen / Invisible / Shield ฯลฯ
-- ทุกอย่างคำนวณฝั่ง server เท่านั้น
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Remotes = require(Shared:WaitForChild("Remotes"))

local StatusService = {}

local states = {} -- [character] = { [statusName] = { Expires = number, ... } }
local pushes = {} -- [character] = เวลาหมดอายุของแรงผลัก

local INVULNERABLE = { "SpawnProtect", "DashIFrame", "Phase" }
local BLOCK_ACTION = { "Stun", "Frozen", "Airborne" }

local function getRoot(character)
	return character:FindFirstChild("HumanoidRootPart")
end

local function getHumanoid(character)
	return character:FindFirstChildOfClass("Humanoid")
end

local function setCollisionGroup(character, group)
	for _, part in ipairs(character:GetDescendants()) do
		if part:IsA("BasePart") then
			part.CollisionGroup = group
		end
	end
end
StatusService.SetCollisionGroup = setCollisionGroup

-- สิ่งที่ต้องทำตอนสถานะเริ่ม / จบ
local Hooks = {}

Hooks.Frozen = {
	Start = function(character, entry)
		local root = getRoot(character)
		if root then
			entry.WasAnchored = root.Anchored
			root.Anchored = true
		end
		local highlight = Instance.new("Highlight")
		highlight.Name = "QA_Frozen"
		highlight.FillColor = Color3.fromRGB(130, 130, 130)
		highlight.FillTransparency = 0.15
		highlight.OutlineColor = Color3.fromRGB(220, 220, 220)
		highlight.DepthMode = Enum.HighlightDepthMode.Occluded
		highlight.Parent = character
	end,
	End = function(character, entry)
		local root = getRoot(character)
		if root and not entry.WasAnchored then
			root.Anchored = false
			local player = Players:GetPlayerFromCharacter(character)
			if player then
				pcall(function()
					root:SetNetworkOwner(player)
				end)
			end
		end
		local highlight = character:FindFirstChild("QA_Frozen")
		if highlight then
			highlight:Destroy()
		end
	end,
}

Hooks.SpawnProtect = {
	Start = function(character)
		local ff = Instance.new("ForceField")
		ff.Name = "QA_SpawnProtect"
		ff.Visible = true
		ff.Parent = character
	end,
	End = function(character)
		local ff = character:FindFirstChild("QA_SpawnProtect")
		if ff then
			ff:Destroy()
		end
	end,
}

Hooks.Phase = {
	Start = function(character)
		setCollisionGroup(character, Config.Groups.Phased)
	end,
	End = function(character)
		setCollisionGroup(character, Config.Groups.Players)
	end,
}

Hooks.Stun = {
	End = function(character)
		-- หลังโดน Stun จะต้านทาน Stun ชั่วครู่ เพื่อไม่ให้โดนล็อกจนตาย
		StatusService.Apply(character, "StunResist", Config.Stun.ResistAfter)
	end,
}

local function refresh(character)
	local humanoid = getHumanoid(character)
	if not humanoid then
		return
	end
	local st = states[character] or {}

	local blocked = false
	for _, name in ipairs(BLOCK_ACTION) do
		if st[name] then
			blocked = true
		end
	end

	local speed = Config.WalkSpeed
	if st.Haste then
		speed *= 1 + (st.Haste.SpeedBonus or 0)
	end
	if st.Slow then
		speed *= 1 - math.clamp(st.Slow.Percent or 0, 0, 0.95)
	end
	if blocked or st.Rooted then
		speed = 0
	end

	if not character:GetAttribute("FixedSpeed") then
		humanoid.WalkSpeed = speed
		humanoid.JumpPower = (blocked or st.Rooted) and 0 or Config.JumpPower
	end

	character:SetAttribute("Invisible", st.Invisible ~= nil)
	character:SetAttribute("Shield", st.Shield and math.ceil(st.Shield.Amount or 0) or 0)
	character:SetAttribute("Stunned", st.Stun ~= nil or st.Frozen ~= nil)
end

local function endStatus(character, name)
	local st = states[character]
	if not st then
		return
	end
	local entry = st[name]
	if not entry then
		return
	end
	st[name] = nil
	local hook = Hooks[name]
	if hook and hook.End and character.Parent then
		hook.End(character, entry)
	end
end

-- ใส่สถานะ ถ้ามีอยู่แล้วจะต่อเวลา (ใช้เวลาที่นานกว่า)
function StatusService.Apply(character, name, duration, data)
	if not character or not character.Parent then
		return nil
	end
	local st = states[character]
	if not st then
		st = {}
		states[character] = st
	end
	local expires = os.clock() + duration
	local entry = st[name]
	if entry then
		entry.Expires = math.max(entry.Expires, expires)
		if data then
			for key, value in pairs(data) do
				entry[key] = value
			end
		end
	else
		entry = data or {}
		entry.Expires = expires
		st[name] = entry
		local hook = Hooks[name]
		if hook and hook.Start then
			hook.Start(character, entry)
		end
	end
	refresh(character)
	return entry
end

function StatusService.Has(character, name)
	local st = states[character]
	return st ~= nil and st[name] ~= nil
end

function StatusService.Get(character, name)
	local st = states[character]
	return st and st[name] or nil
end

function StatusService.Remove(character, name)
	if StatusService.Has(character, name) then
		endStatus(character, name)
		refresh(character)
	end
end

function StatusService.Clear(character)
	local st = states[character]
	if st then
		local names = {}
		for name in pairs(st) do
			table.insert(names, name)
		end
		for _, name in ipairs(names) do
			endStatus(character, name)
		end
	end
	states[character] = nil
	pushes[character] = nil
end

function StatusService.IsInvulnerable(character)
	local st = states[character]
	if not st then
		return false
	end
	for _, name in ipairs(INVULNERABLE) do
		if st[name] then
			return true
		end
	end
	return false
end

function StatusService.CanAct(character)
	local st = states[character]
	if not st then
		return true
	end
	for _, name in ipairs(BLOCK_ACTION) do
		if st[name] then
			return false
		end
	end
	return true
end

function StatusService.CanAttack(character)
	return StatusService.CanAct(character) and not StatusService.Has(character, "Phase")
end

---------------------------------------------------------------------------
-- สถานะแต่ละแบบ
---------------------------------------------------------------------------

local function statusVFX(character, kind, duration)
	Remotes.PlayVFX:FireAllClients("Status", { Target = character, Kind = kind, Duration = duration })
end

-- Stun: ซ้อนกันได้ไม่เกิน Config.Stun.MaxDuration และมีช่วงต้านทานหลังหลุด
function StatusService.Stun(character, duration)
	if StatusService.Has(character, "StunResist") or StatusService.IsInvulnerable(character) then
		return false
	end
	local now = os.clock()
	local entry = StatusService.Get(character, "Stun")
	local remaining = entry and math.max(0, entry.Expires - now) or 0
	local total = math.min(remaining + duration, Config.Stun.MaxDuration)
	if entry then
		entry.Expires = now + total
	else
		StatusService.Apply(character, "Stun", total)
	end
	statusVFX(character, "Stun", total)
	return true
end

function StatusService.Slow(character, percent, duration)
	if StatusService.IsInvulnerable(character) then
		return
	end
	local entry = StatusService.Get(character, "Slow")
	if entry then
		percent = math.max(percent, entry.Percent or 0)
	end
	StatusService.Apply(character, "Slow", duration, { Percent = percent })
end

function StatusService.Freeze(character, duration)
	if StatusService.IsInvulnerable(character) then
		return
	end
	StatusService.Apply(character, "Frozen", duration)
end

function StatusService.Haste(character, speedBonus, duration)
	StatusService.Apply(character, "Haste", duration, { SpeedBonus = speedBonus })
	statusVFX(character, "Haste", duration)
end

function StatusService.SetInvisible(character, duration)
	StatusService.Apply(character, "Invisible", duration)
end

function StatusService.Shield(character, amount, duration, reflect)
	StatusService.Remove(character, "Shield")
	StatusService.Apply(character, "Shield", duration, { Amount = amount, Reflect = reflect })
	statusVFX(character, "Shield", duration)
end

-- หักดาเมจออกจากโล่ คืนค่า (ดาเมจที่เหลือ, ค่าดาเมจสะท้อน หรือ nil)
function StatusService.AbsorbShield(character, damage)
	local entry = StatusService.Get(character, "Shield")
	if not entry then
		return damage, nil
	end
	local absorbed = math.min(entry.Amount, damage)
	entry.Amount -= absorbed
	local reflect = entry.Reflect
	if entry.Amount <= 0 then
		StatusService.Remove(character, "Shield")
	else
		refresh(character)
	end
	return damage - absorbed, reflect
end

-- แรงผลักชั่วคราวด้วย LinearVelocity (server สร้าง, client ที่เป็นเจ้าของร่างจำลองฟิสิกส์)
function StatusService.Push(character, velocity, duration)
	local root = getRoot(character)
	if not root or root.Anchored then
		return
	end
	local attachment = root:FindFirstChild("QA_PushAttachment")
	if not attachment then
		attachment = Instance.new("Attachment")
		attachment.Name = "QA_PushAttachment"
		attachment.Parent = root
	end
	local mover = root:FindFirstChild("QA_Push")
	if not mover then
		mover = Instance.new("LinearVelocity")
		mover.Name = "QA_Push"
		mover.Attachment0 = attachment
		mover.RelativeTo = Enum.ActuatorRelativeTo.World
		mover.VelocityConstraintMode = Enum.VelocityConstraintMode.Vector
		-- จำกัดแรงไว้ เพื่อไม่ให้ดันตัวละครทะลุกำแพง
		mover.ForceLimitsEnabled = true
		mover.MaxForce = 200000
		mover.Parent = root
	end
	mover.VectorVelocity = velocity
	pushes[character] = os.clock() + duration
end

function StatusService.StopPush(character)
	pushes[character] = nil
	local root = getRoot(character)
	local mover = root and root:FindFirstChild("QA_Push")
	if mover then
		mover:Destroy()
	end
end

function StatusService.Knockback(character, velocity, duration)
	if StatusService.IsInvulnerable(character) then
		return
	end
	StatusService.Push(character, velocity, duration or 0.25)
end

-- ลอยกลางอากาศ: ดันขึ้นแล้วใช้สกิลไม่ได้ตลอดช่วงเวลา
function StatusService.Airborne(character, duration, upSpeed)
	if StatusService.IsInvulnerable(character) then
		return
	end
	StatusService.Apply(character, "Airborne", duration)
	StatusService.Push(character, Vector3.new(0, upSpeed or 45, 0), math.min(0.35, duration))
end

---------------------------------------------------------------------------
-- วนตรวจหมดอายุ
---------------------------------------------------------------------------

RunService.Heartbeat:Connect(function()
	local now = os.clock()
	for character, st in pairs(states) do
		if not character.Parent then
			states[character] = nil
		else
			local expired
			for name, entry in pairs(st) do
				if entry.Expires <= now then
					expired = expired or {}
					table.insert(expired, name)
				end
			end
			if expired then
				for _, name in ipairs(expired) do
					endStatus(character, name)
				end
				refresh(character)
			end
		end
	end
	for character, expires in pairs(pushes) do
		if expires <= now or not character.Parent then
			StatusService.StopPush(character)
		end
	end
end)

return StatusService

-- ตัวช่วยที่ SkillHandlers ใช้ร่วมกัน: หาเป้า, hitbox, กระสุน, การเคลื่อนที่, สั่งเอฟเฟกต์
local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Remotes = require(Shared:WaitForChild("Remotes"))

local CombatService = require(script.Parent.CombatService)
local StatusService = require(script.Parent.StatusService)

local U = {}

U.COMBATANT_TAG = "QA_Combatant"

local START_BACK = 1.5

local function ensureFolder(name)
	local folder = Workspace:FindFirstChild(name)
	if not folder then
		folder = Instance.new("Folder")
		folder.Name = name
		folder.Parent = Workspace
	end
	return folder
end

function U.MapFolder()
	return ensureFolder("Map")
end

function U.EffectsFolder()
	return ensureFolder("Effects")
end

function U.EntitiesFolder()
	return ensureFolder("Entities")
end

function U.VFX(effectId, data)
	Remotes.PlayVFX:FireAllClients(effectId, data)
end

function U.Root(model)
	return model and model:FindFirstChild("HumanoidRootPart")
end

function U.Position(model)
	local root = U.Root(model)
	return root and root.Position
end

function U.Flat(vector)
	return Vector3.new(vector.X, 0, vector.Z)
end

function U.Rotate(direction, degrees)
	return (CFrame.Angles(0, math.rad(degrees), 0) * direction)
end

-- หา Model ที่มี Humanoid จากชิ้นส่วน
function U.ModelFromPart(part)
	local model = part:FindFirstAncestorOfClass("Model")
	while model do
		if model:FindFirstChildOfClass("Humanoid") then
			return model
		end
		model = model:FindFirstAncestorOfClass("Model")
	end
	return nil
end

-- เป้าที่โจมตีได้: ยังมีชีวิต, ไม่ใช่ตัวเอง/ของตัวเอง, ไม่อยู่ใน Lobby, ไม่อมตะ
function U.IsEnemy(player, model)
	if not CombatService.IsAlive(model) then
		return false
	end
	if player then
		if model == player.Character or model:GetAttribute("OwnerId") == player.UserId then
			return false
		end
	end
	if CombatService.InLobby(model) or StatusService.IsInvulnerable(model) then
		return false
	end
	return true
end

function U.AllCombatants()
	local list = {}
	for _, player in ipairs(Players:GetPlayers()) do
		if player.Character then
			table.insert(list, player.Character)
		end
	end
	for _, model in ipairs(CollectionService:GetTagged(U.COMBATANT_TAG)) do
		table.insert(list, model)
	end
	return list
end

local function overlapParams(player)
	local params = OverlapParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	local exclude = { U.MapFolder(), U.EffectsFolder() }
	if player and player.Character then
		table.insert(exclude, player.Character)
	end
	params.FilterDescendantsInstances = exclude
	return params
end

local function enemiesFromParts(player, parts)
	local seen, list = {}, {}
	for _, part in ipairs(parts) do
		local model = U.ModelFromPart(part)
		if model and not seen[model] then
			seen[model] = true
			if U.IsEnemy(player, model) then
				table.insert(list, model)
			end
		end
	end
	return list
end

function U.EnemiesInRadius(player, position, radius)
	local parts = Workspace:GetPartBoundsInRadius(position, radius, overlapParams(player))
	return enemiesFromParts(player, parts)
end

function U.EnemiesInBox(player, cframe, size)
	local parts = Workspace:GetPartBoundsInBox(cframe, size, overlapParams(player))
	return enemiesFromParts(player, parts)
end

-- กล่องเส้นตรงจาก origin ไปตาม direction (ใช้กับฟัน/พุ่ง/เลเซอร์ทะลุ)
function U.EnemiesInLine(player, origin, direction, length, width, height)
	local center = origin + direction * (length / 2)
	local cframe = CFrame.lookAt(center, center + direction)
	return U.EnemiesInBox(player, cframe, Vector3.new(width, height or 8, length))
end

function U.NearestEnemy(player, position, radius, exclude)
	local best, bestDist
	for _, model in ipairs(U.AllCombatants()) do
		if not (exclude and exclude[model]) and U.IsEnemy(player, model) then
			local dist = (U.Position(model) - position).Magnitude
			if dist <= radius and (not bestDist or dist < bestDist) then
				best, bestDist = model, dist
			end
		end
	end
	return best, bestDist
end

local function worldParams()
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Include
	params.FilterDescendantsInstances = { U.MapFolder() }
	params.RespectCanCollide = true
	return params
end

-- Raycast เฉพาะแผนที่ (กำแพง/พื้น)
function U.RaycastWorld(origin, displacement)
	return Workspace:Raycast(origin, displacement, worldParams())
end

function U.HasLineOfSight(from, to)
	return U.RaycastWorld(from, to - from) == nil
end

-- หาพื้นใต้จุดที่กำหนด
function U.GroundBelow(position, maxDrop)
	local result = U.RaycastWorld(position + Vector3.new(0, 4, 0), Vector3.new(0, -(maxDrop or 300), 0))
	return result and result.Position or nil
end

-- ยิงทันที (hitscan): คืนค่า (เป้า หรือ nil, จุดที่โดน)
function U.Hitscan(player, origin, direction, range, radius)
	local filter = { U.EffectsFolder() }
	if player.Character then
		table.insert(filter, player.Character)
	end
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = filter
	-- เริ่มยิงจากด้านหลังเล็กน้อย เป้าที่ยืนชิดตัวจะได้ไม่หลุด (Spherecast ไม่นับสิ่งที่ซ้อนอยู่ตั้งแต่ต้น)
	local start = origin - direction * START_BACK
	for _ = 1, 12 do
		local result = Workspace:Spherecast(start, radius or 1, direction * (range + START_BACK), params)
		if not result then
			break
		end
		local model = U.ModelFromPart(result.Instance)
		if model then
			if U.IsEnemy(player, model) then
				return model, result.Position
			end
			table.insert(filter, model)
		elseif result.Instance.CanCollide then
			return nil, result.Position
		else
			table.insert(filter, result.Instance)
		end
		params.FilterDescendantsInstances = filter
	end
	return nil, origin + direction * range
end

--[[ กระสุนที่ server จำลองเอง (client แค่วาดภาพตาม)
	opts = {
		Origin, Direction, Speed, Range, Radius,
		Pierce = จำนวนเป้าที่ทะลุได้เพิ่ม (true = ทะลุทุกคน),
		OnHit = function(model, position) -> true ถ้าต้องการหยุดกระสุน,
		OnEnd = function(position, hitWorld),
		Visual = ตารางข้อมูลเอฟเฟกต์ (Color, Size, Style) หรือ nil,
	}
]]
function U.Projectile(player, opts)
	local origin, direction = opts.Origin, opts.Direction
	local speed, range, radius = opts.Speed, opts.Range, opts.Radius or 1
	local pierce = opts.Pierce or 0

	if opts.Visual then
		local visual = table.clone(opts.Visual)
		visual.Origin = origin
		visual.Direction = direction
		visual.Speed = speed
		visual.Range = range
		visual.Owner = player.Character
		visual.Pierce = pierce == true or pierce > 0
		U.VFX("Projectile", visual)
	end

	local filter = { U.EffectsFolder() }
	if player.Character then
		table.insert(filter, player.Character)
	end
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = filter

	local function finish(position, hitWorld)
		if opts.OnEnd then
			opts.OnEnd(position, hitWorld)
		end
	end

	-- จัดการเมื่อกระสุนโดนเป้า คืนค่า true ถ้ากระสุนต้องหยุด
	local function hitEnemy(model, position)
		local stop = opts.OnHit and opts.OnHit(model, position)
		if pierce ~= true then
			pierce -= 1
		end
		return stop or (pierce ~= true and pierce < 0)
	end

	task.spawn(function()
		-- เป้าที่ซ้อนอยู่กับกระสุนตั้งแต่ต้น (ยืนชิดตัว) Spherecast จะมองไม่เห็น จึงเช็กด้วยรัศมีก่อน
		for _, model in ipairs(U.EnemiesInRadius(player, origin, radius + 0.5)) do
			table.insert(filter, model)
			if hitEnemy(model, U.Position(model)) then
				finish(origin, false)
				return
			end
		end
		params.FilterDescendantsInstances = filter

		local position = origin - direction * START_BACK
		local traveled = -START_BACK
		while traveled < range do
			local dt = RunService.Heartbeat:Wait()
			local step = math.min(speed * dt, range - traveled)
			for _ = 1, 10 do
				local result = Workspace:Spherecast(position, radius, direction * step, params)
				if not result then
					break
				end
				local model = U.ModelFromPart(result.Instance)
				if model then
					table.insert(filter, model)
					params.FilterDescendantsInstances = filter
					if U.IsEnemy(player, model) and hitEnemy(model, result.Position) then
						finish(result.Position, false)
						return
					end
				elseif result.Instance.CanCollide then
					finish(result.Position, true)
					return
				else
					table.insert(filter, result.Instance)
					params.FilterDescendantsInstances = filter
				end
			end
			position += direction * step
			traveled += step
		end
		finish(position, false)
	end)
end

-- ระยะที่เคลื่อนที่ได้จริงโดยไม่ทะลุกำแพง
function U.ClampMove(origin, direction, distance)
	local result = U.RaycastWorld(origin, direction * (distance + 2))
	if result then
		return math.max(0, (result.Position - origin).Magnitude - 3)
	end
	return distance
end

-- พุ่งด้วยแรงผลัก คืนค่า (จุดเริ่ม, จุดจบโดยประมาณ, ระยะ)
function U.Dash(character, direction, distance, duration)
	local root = U.Root(character)
	local origin = root.Position
	local flat = U.Flat(direction)
	if flat.Magnitude < 0.05 then
		flat = U.Flat(root.CFrame.LookVector)
	end
	flat = flat.Unit
	local allowed = U.ClampMove(origin, flat, distance)
	if allowed > 1 then
		StatusService.Push(character, flat * (allowed / duration), duration)
	end
	return origin, origin + flat * allowed, allowed
end

function U.Teleport(character, position, lookDirection)
	local look = lookDirection and U.Flat(lookDirection) or nil
	if not look or look.Magnitude < 0.05 then
		look = U.Flat(character:GetPivot().LookVector)
	end
	StatusService.StopPush(character)
	character:PivotTo(CFrame.lookAt(position, position + look.Unit))
end

-- คำนวณจุดเล็งที่ถูกต้องจาก aimPosition ที่ client ส่งมา (ตัดระยะไม่ให้เกิน range)
-- คืนค่า origin, direction (หน่วยเดียว), point (จุดบนพื้น), target (ศัตรูที่เล็งอยู่ หรือ nil)
function U.ResolveAim(player, character, aimPosition, range)
	local root = U.Root(character)
	local origin = root.Position
	local delta = aimPosition - origin
	local flat = U.Flat(delta)
	local flatDir
	if flat.Magnitude < 0.5 then
		flatDir = U.Flat(root.CFrame.LookVector).Unit
	else
		flatDir = flat.Unit
	end

	-- ถ้าเล็งโดนตัวศัตรู ให้ยิงเป็น 3 มิติไปหาเป้า ไม่งั้นยิงแนวราบ
	local direction = flatDir
	local target = U.NearestEnemy(player, aimPosition, 6)
	if target then
		local toTarget = U.Position(target) - origin
		if toTarget.Magnitude > 1 then
			direction = toTarget.Unit
		end
	end

	local maxRange = math.max(range or 0, 0)
	local distance = math.min(flat.Magnitude, maxRange)
	local point = origin + flatDir * distance
	local probeY = math.clamp(aimPosition.Y, origin.Y - 80, origin.Y + 80)
	local ground = U.GroundBelow(Vector3.new(point.X, probeY + 2, point.Z))
		or U.GroundBelow(Vector3.new(point.X, origin.Y + 40, point.Z))
	if ground then
		point = ground
	else
		point = Vector3.new(point.X, origin.Y - 3, point.Z)
	end

	return origin, direction, point, target
end

return U

-- สกิลสายนินจา (Ninja)
local Server = script.Parent.Parent
local CombatService = require(Server.CombatService)
local StatusService = require(Server.StatusService)
local U = require(Server.SkillUtil)

local CollectionService = game:GetService("CollectionService")
local Debris = game:GetService("Debris")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Remotes = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Remotes"))

local H = {}

H.ShadowDash = function(player, character, p)
	local skill = p.Skill
	local from, to, distance = U.Dash(character, p.Direction, skill.Range, 0.15)
	U.VFX("Dash", { From = from, To = to, Color = p.Color, Target = character })
	if distance > 0.5 then
		local direction = (to - from).Unit
		for _, model in ipairs(U.EnemiesInLine(player, from, direction, distance + 3, skill.Width, 9)) do
			CombatService.Damage(player, model, skill.Damage, p.Name)
		end
	end
end

-- ดาวกระจาย 5 ดวงเป็นรูปพัด
H.ShurikenFan = function(player, _character, p)
	local skill = p.Skill
	for i = 1, skill.Hits do
		local angle = (i - (skill.Hits + 1) / 2) * skill.SpreadAngle
		local direction = U.Rotate(p.Direction, angle)
		U.Projectile(player, {
			Origin = p.Origin + direction * 2,
			Direction = direction,
			Speed = skill.Speed,
			Range = skill.Range,
			Radius = 0.9,
			Visual = { Color = p.Color, Size = 1.1, Style = "Shuriken" },
			OnHit = function(model)
				CombatService.Damage(player, model, skill.Damage, p.Name)
			end,
		})
	end
end

-- ร่างปลอม 2 ร่างวิ่งไปคนละทาง
H.CloneJutsu = function(player, character, p)
	local skill = p.Skill
	local forward = U.Flat(p.Direction)
	forward = forward.Magnitude > 0.05 and forward.Unit or Vector3.new(0, 0, -1)
	U.VFX("Explosion", { Position = p.Origin, Radius = 6, Color = Color3.fromRGB(220, 220, 220), Duration = 0.35 })

	for _, angle in ipairs({ -55, 55 }) do
		local wasArchivable = character.Archivable
		character.Archivable = true
		local clone = character:Clone()
		character.Archivable = wasArchivable
		if clone then
			for _, item in ipairs(clone:GetDescendants()) do
				if
					item:IsA("BaseScript")
					or item:IsA("ForceField")
					or item:IsA("Highlight")
					or item.Name == "QA_Push"
					or item.Name == "QA_PushAttachment"
				then
					item:Destroy()
				end
			end
			clone.Name = player.Name
			clone:SetAttribute("OwnerId", player.UserId)
			clone:SetAttribute("OneHit", true)
			clone:SetAttribute("Invisible", false)
			local direction = U.Rotate(forward, angle)
			clone:PivotTo(CFrame.lookAt(p.Origin + direction * 3, p.Origin + direction * 10))
			CollectionService:AddTag(clone, U.COMBATANT_TAG)
			clone.Parent = U.EntitiesFolder()

			local humanoid = clone:FindFirstChildOfClass("Humanoid")
			local root = U.Root(clone)
			if humanoid and root then
				root.Anchored = false
				pcall(function()
					root:SetNetworkOwner(nil)
				end)
				humanoid.WalkSpeed = Config.WalkSpeed
				humanoid:MoveTo(p.Origin + direction * 140)
			end
			Debris:AddItem(clone, skill.Duration)
		end
	end
end

-- วาร์ปไปหลังศัตรูแล้วแทง ถ้าเป้าไม่ได้หันมาทางเรา ดาเมจ 2 เท่า
H.Backstab = function(player, character, p)
	local skill = p.Skill
	local origin = p.Origin
	local target = p.Target
	if target and (U.Position(target) - origin).Magnitude > skill.Range + 2 then
		target = nil
	end
	if not target then
		-- ไม่ได้เล็งโดนตัวตรง ๆ: หาศัตรูที่ใกล้สุดในกรวยด้านหน้า
		local forward = U.Flat(p.Direction)
		forward = forward.Magnitude > 0.05 and forward.Unit or Vector3.new(0, 0, -1)
		local bestDist
		for _, model in ipairs(U.AllCombatants()) do
			if U.IsEnemy(player, model) then
				local delta = U.Position(model) - origin
				local dist = delta.Magnitude
				local flat = U.Flat(delta)
				if dist <= skill.Range and flat.Magnitude > 0.1 and flat.Unit:Dot(forward) >= 0.8 then
					if not bestDist or dist < bestDist then
						target, bestDist = model, dist
					end
				end
			end
		end
	end
	if not target then
		p.Refund()
		Remotes.SkillFeedback:FireClient(player, { Type = "Notice", Text = "ไม่มีเป้าหมายในระยะ" })
		return
	end

	local targetRoot = U.Root(target)
	local targetPos = targetRoot.Position
	local targetLook = U.Flat(targetRoot.CFrame.LookVector)
	targetLook = targetLook.Magnitude > 0.05 and targetLook.Unit or Vector3.new(0, 0, -1)
	local toCaster = U.Flat(origin - targetPos)
	toCaster = toCaster.Magnitude > 0.05 and toCaster.Unit or -targetLook
	local facingUs = targetLook:Dot(toCaster) > 0.3

	local destination = targetPos - targetLook * 3.5
	if not U.HasLineOfSight(targetPos, destination) then
		destination = targetPos + toCaster * 3
	end
	U.VFX("Dash", { From = origin, To = destination, Color = p.Color, Target = character })
	U.Teleport(character, destination, targetPos - destination)

	local damage = facingUs and skill.Damage or skill.Damage * 2
	local direction = U.Flat(targetPos - destination)
	direction = direction.Magnitude > 0.05 and direction.Unit or targetLook
	U.VFX("Slash", { Position = destination, Direction = direction, Range = 6, Width = 5, Color = p.Color, Final = not facingUs })
	CombatService.Damage(player, target, damage, p.Name)
end

-- ควันพราง: เราล่องหนเมื่ออยู่ในควัน (client ซ่อนชื่อ/แถบเลือดให้คนที่อยู่ในควัน)
H.SmokeBomb = function(_player, character, p)
	local skill = p.Skill
	local center = p.Origin
	U.VFX("Zone", { Position = center, Radius = skill.Radius, Color = Color3.fromRGB(150, 160, 150), Duration = skill.Duration, Kind = "Smoke" })
	local step = 0.25
	for _ = 1, math.floor(skill.Duration / step + 0.5) do
		if not CombatService.IsAlive(character) then
			return
		end
		local position = U.Position(character)
		if position and (position - center).Magnitude <= skill.Radius then
			StatusService.SetInvisible(character, step + 0.2)
		end
		task.wait(step)
	end
end

return H

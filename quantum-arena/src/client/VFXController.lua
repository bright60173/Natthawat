-- เล่นเอฟเฟกต์ตามที่ server สั่ง + ตัวเลขดาเมจลอย + การล่องหน + ควันบังชื่อ
local Debris = game:GetService("Debris")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Remotes = require(Shared:WaitForChild("Remotes"))
local VFX = require(Shared:WaitForChild("VFX"))

local player = Players.LocalPlayer

local VFXController = {}

---------------------------------------------------------------------------
-- ตัวเลขดาเมจลอย (เฉพาะผู้ตีเห็น)
---------------------------------------------------------------------------
local function damageNumber(position, amount, shielded)
	local holder = Instance.new("Part")
	holder.Anchored = true
	holder.CanCollide = false
	holder.CanQuery = false
	holder.CanTouch = false
	holder.Transparency = 1
	holder.Size = Vector3.new(0.2, 0.2, 0.2)
	holder.Position = position + Vector3.new((math.random() - 0.5) * 3, 3 + math.random(), (math.random() - 0.5) * 3)

	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(120, 50)
	gui.AlwaysOnTop = true
	gui.LightInfluence = 0
	gui.Parent = holder

	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Size = UDim2.fromScale(1, 1)
	label.Font = Enum.Font.GothamBlack
	label.TextSize = amount >= 30 and 34 or 26
	label.Text = tostring(amount)
	label.TextColor3 = shielded and Color3.fromRGB(120, 210, 255) or (amount >= 30 and Color3.fromRGB(255, 210, 60) or Color3.new(1, 1, 1))
	label.TextStrokeTransparency = 0.2
	label.Parent = gui

	local folder = Workspace:FindFirstChild("LocalEffects") or Workspace
	holder.Parent = folder

	local info = TweenInfo.new(0.8, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	TweenService:Create(gui, info, { StudsOffset = Vector3.new(0, 3.5, 0) }):Play()
	TweenService:Create(label, TweenInfo.new(0.8, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
		TextTransparency = 1,
		TextStrokeTransparency = 1,
	}):Play()
	Debris:AddItem(holder, 0.9)
end

---------------------------------------------------------------------------
-- ล่องหน: คนอื่นเห็นโปร่งใส 0.9 ตัวเองเห็นจาง ๆ
---------------------------------------------------------------------------
local hidden = {} -- [character] = { [instance] = ค่าความโปร่งใสเดิม }

local function setInvisible(character, invisible)
	if invisible then
		if hidden[character] then
			return
		end
		local original = {}
		hidden[character] = original
		local amount = character == player.Character and 0.6 or 0.9
		for _, item in ipairs(character:GetDescendants()) do
			if (item:IsA("BasePart") or item:IsA("Decal")) and item.Transparency < 1 then
				original[item] = item.Transparency
				item.Transparency = math.max(item.Transparency, amount)
			end
		end
	else
		local original = hidden[character]
		if not original then
			return
		end
		hidden[character] = nil
		for item, transparency in pairs(original) do
			if item.Parent then
				item.Transparency = transparency
			end
		end
	end
end

local function watchCharacter(character)
	character:GetAttributeChangedSignal("Invisible"):Connect(function()
		setInvisible(character, character:GetAttribute("Invisible") == true)
	end)
	if character:GetAttribute("Invisible") then
		setInvisible(character, true)
	end
	character.Destroying:Connect(function()
		hidden[character] = nil
	end)
end

local function watchPlayer(other)
	other.CharacterAdded:Connect(watchCharacter)
	if other.Character then
		watchCharacter(other.Character)
	end
end

local function inSmoke(position)
	local now = os.clock()
	for i = #VFX.SmokeZones, 1, -1 do
		local zone = VFX.SmokeZones[i]
		if zone.Expires <= now then
			table.remove(VFX.SmokeZones, i)
		elseif (zone.Position - position).Magnitude <= zone.Radius then
			return true
		end
	end
	return false
end

-- ซ่อนชื่อ/แถบเลือดเหนือหัว: เมื่อเราอยู่ในควัน หรือเป้าล่องหน/อยู่ในควัน
local function updateOverheads()
	local myRoot = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	local blind = myRoot ~= nil and inSmoke(myRoot.Position)
	for _, other in ipairs(Players:GetPlayers()) do
		local character = other.Character
		local head = character and character:FindFirstChild("Head")
		local gui = head and head:FindFirstChild("QA_Overhead")
		if gui then
			local hide = blind or character:GetAttribute("Invisible") == true or inSmoke(head.Position)
			gui.Enabled = not hide
		end
	end
end

---------------------------------------------------------------------------
-- ตอนเราโดนตี: ขอบจอวาบแดง + กล้องสั่นตามดาเมจ
---------------------------------------------------------------------------
local function watchOwnDamage()
	local gui = Instance.new("ScreenGui")
	gui.Name = "QA_DamageFlash"
	gui.ResetOnSpawn = false
	gui.IgnoreGuiInset = true
	gui.DisplayOrder = 3
	local frame = Instance.new("Frame")
	frame.Size = UDim2.fromScale(1, 1)
	frame.BackgroundColor3 = Color3.fromRGB(255, 30, 40)
	frame.BackgroundTransparency = 1
	frame.BorderSizePixel = 0
	frame.Active = false
	frame.Parent = gui
	local gradient = Instance.new("UIGradient")
	-- โปร่งตรงกลาง เข้มที่ขอบซ้ายขวา
	gradient.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0),
		NumberSequenceKeypoint.new(0.3, 1),
		NumberSequenceKeypoint.new(0.7, 1),
		NumberSequenceKeypoint.new(1, 0),
	})
	gradient.Parent = frame
	gui.Parent = player:WaitForChild("PlayerGui")

	local function bind(character)
		local humanoid = character:WaitForChild("Humanoid", 10)
		if not humanoid then
			return
		end
		local last = humanoid.Health
		humanoid.HealthChanged:Connect(function(health)
			local lost = last - health
			last = health
			if lost >= 1 and player:GetAttribute("InArena") then
				VFX.Shake(math.clamp(lost / 55, 0.12, 0.7))
				frame.BackgroundTransparency = math.clamp(0.75 - lost / 80, 0.3, 0.75)
				TweenService:Create(frame, TweenInfo.new(0.35), { BackgroundTransparency = 1 }):Play()
			end
		end)
	end
	player.CharacterAdded:Connect(bind)
	if player.Character then
		task.spawn(bind, player.Character)
	end
end

function VFXController.Init()
	Remotes.PlayVFX.OnClientEvent:Connect(function(effectId, data)
		local ok, err = pcall(VFX.Play, effectId, data)
		if not ok then
			warn("[VFX] " .. tostring(effectId) .. ": " .. tostring(err))
		end
	end)

	Remotes.SkillFeedback.OnClientEvent:Connect(function(message)
		if type(message) == "table" and message.Type == "Damage" then
			damageNumber(message.Position, message.Amount, message.Shielded)
			-- ความรู้สึกตอนตีโดน: ยิ่งแรงยิ่งสั่น ตีหนักมีจอวาบ + ซูมกระตุก + หยุดภาพ
			local amount = tonumber(message.Amount) or 0
			VFX.Shake(math.clamp(amount / 75, 0.08, 0.5))
			if amount >= 30 then
				VFX.ImpactFrame(0.07)
				VFX.FovPunch(6)
				VFX.HitStop(player.Character, 0.08)
			elseif amount >= 14 then
				VFX.FovPunch(2.5)
			end
		end
	end)

	watchOwnDamage()

	Players.PlayerAdded:Connect(watchPlayer)
	for _, other in ipairs(Players:GetPlayers()) do
		watchPlayer(other)
	end

	task.spawn(function()
		while true do
			task.wait(0.15)
			updateOverheads()
		end
	end)
end

return VFXController

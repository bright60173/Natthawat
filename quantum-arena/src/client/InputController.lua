-- รับปุ่มจากคีย์บอร์ด / เมาส์ / จอย / ปุ่มมือถือ แล้วส่ง "ขอใช้สกิล + จุดที่เล็ง" ให้ server
-- (client ไม่ตัดสินดาเมจ/คูลดาวน์เอง ค่าคูลดาวน์ที่เก็บไว้นี้ใช้แสดงผลและกันสแปมเท่านั้น)
local ContextActionService = game:GetService("ContextActionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Classes = require(Shared:WaitForChild("Classes"))
local Remotes = require(Shared:WaitForChild("Remotes"))

local player = Players.LocalPlayer

local InputController = {}

InputController.Cooldowns = {} -- [key] = { Remaining, Total }
InputController.Rate = 1
InputController.IsTouch = UserInputService.TouchEnabled

local KEYS = { "0", "1", "2", "3", "dash" }
for _, key in ipairs(KEYS) do
	InputController.Cooldowns[key] = { Remaining = 0, Total = 1 }
end

local menuHandler -- ตั้งโดย Main (เปิด/ปิดหน้าเลือกสาย)
local blocked = function()
	return false
end
local holdingBasic = false
local lastSend = 0

function InputController.SetMenuHandler(callback)
	menuHandler = callback
end

-- ฟังก์ชันที่บอกว่าตอนนี้ห้ามรับปุ่มต่อสู้ไหม (เช่น หน้าเลือกสายเปิดอยู่)
function InputController.SetBlocked(callback)
	blocked = callback
end

function InputController.GetSubclass()
	return Classes.GetSubclass(player:GetAttribute("Subclass"))
end

local function getCharacter()
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	local root = character and character:FindFirstChild("HumanoidRootPart")
	if humanoid and root and humanoid.Health > 0 then
		return character, humanoid, root
	end
	return nil
end

-- จุดที่เล็ง: คอมใช้ตำแหน่งเมาส์ มือถือ/จอยใช้ทิศที่กล้องหัน (กลางจอ)
function InputController.GetAimPosition()
	local camera = Workspace.CurrentCamera
	local character, _, root = getCharacter()
	if not camera or not character then
		return Vector3.zero
	end

	local useMouse = UserInputService.MouseEnabled
		and UserInputService:GetLastInputType() ~= Enum.UserInputType.Touch
		and not tostring(UserInputService:GetLastInputType()):find("Gamepad")
	local ray
	if useMouse then
		local location = UserInputService:GetMouseLocation()
		ray = camera:ViewportPointToRay(location.X, location.Y)
	else
		local size = camera.ViewportSize
		ray = camera:ViewportPointToRay(size.X / 2, size.Y / 2)
	end

	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	local exclude = { character }
	for _, name in ipairs({ "LocalEffects", "Effects" }) do
		local folder = Workspace:FindFirstChild(name)
		if folder then
			table.insert(exclude, folder)
		end
	end
	params.FilterDescendantsInstances = exclude

	local result = Workspace:Raycast(ray.Origin, ray.Direction * 600, params)
	if result then
		return result.Position
	end
	if not useMouse then
		-- มองขึ้นฟ้า: ใช้ทิศกล้องแนวราบ
		local look = camera.CFrame.LookVector
		local flat = Vector3.new(look.X, 0, look.Z)
		if flat.Magnitude > 0.05 then
			return root.Position + flat.Unit * 60
		end
	end
	return ray.Origin + ray.Direction * 300
end

-- ขอใช้สกิล: slot = 0 (โจมตีปกติ), 1–3, "dash"
function InputController.Trigger(slot)
	if blocked() or not player:GetAttribute("InArena") then
		return
	end
	local character, _, root = getCharacter()
	if not character then
		return
	end
	local key = tostring(slot)
	local cooldown = InputController.Cooldowns[key]
	if not cooldown or cooldown.Remaining > 0.03 then
		return
	end
	local now = os.clock()
	if now - lastSend < 0.06 then
		return
	end
	lastSend = now

	local aim = InputController.GetAimPosition()

	-- หันตัวไปทางที่เล็ง (เฉพาะภาพ ผลจริง server คิดเอง)
	if slot ~= "dash" and not character:GetAttribute("Stunned") then
		local flat = Vector3.new(aim.X - root.Position.X, 0, aim.Z - root.Position.Z)
		if flat.Magnitude > 1 and not root.Anchored then
			root.CFrame = CFrame.lookAt(root.Position, root.Position + flat.Unit)
		end
	end

	-- กันกดรัวระหว่างรอ server ตอบ (server จะส่งค่าคูลดาวน์จริงมาทับ)
	local sub = InputController.GetSubclass()
	if slot == 0 and sub then
		cooldown.Remaining = sub.Basic.Cooldown
		cooldown.Total = sub.Basic.Cooldown
	else
		cooldown.Remaining = math.max(cooldown.Remaining, 0.25)
	end

	Remotes.UseSkill:FireServer(slot, aim)
end

function InputController.SetHoldingBasic(holding)
	holdingBasic = holding
	if holding then
		InputController.Trigger(0)
	end
end

function InputController.OpenMenu()
	if player:GetAttribute("InArena") then
		Remotes.ReturnToLobby:FireServer()
	elseif menuHandler then
		menuHandler()
	end
end

---------------------------------------------------------------------------
-- กระโดด 2 ครั้ง (ความสามารถติดตัวของนินจา)
---------------------------------------------------------------------------
local function setupDoubleJump()
	local usedDouble = false
	local lastJump = 0

	local function bind(character)
		local humanoid = character:WaitForChild("Humanoid", 10)
		if not humanoid then
			return
		end
		usedDouble = false
		humanoid.StateChanged:Connect(function(_, new)
			if new == Enum.HumanoidStateType.Landed or new == Enum.HumanoidStateType.Running then
				usedDouble = false
			elseif new == Enum.HumanoidStateType.Jumping then
				lastJump = os.clock()
			end
		end)
	end
	player.CharacterAdded:Connect(bind)
	if player.Character then
		task.spawn(bind, player.Character)
	end

	UserInputService.JumpRequest:Connect(function()
		local sub = InputController.GetSubclass()
		if not sub or not sub.DoubleJump or usedDouble then
			return
		end
		local character, humanoid = getCharacter()
		if not character or character:GetAttribute("Stunned") then
			return
		end
		local state = humanoid:GetState()
		local inAir = state == Enum.HumanoidStateType.Freefall or state == Enum.HumanoidStateType.Jumping
		if inAir and os.clock() - lastJump > 0.22 then
			usedDouble = true
			humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
		end
	end)
end

function InputController.Init()
	-- คูลดาวน์จริงจาก server
	Remotes.SkillFeedback.OnClientEvent:Connect(function(message)
		if type(message) ~= "table" or message.Type ~= "Cooldowns" then
			return
		end
		InputController.Rate = message.Rate or 1
		for _, key in ipairs(KEYS) do
			local entry = InputController.Cooldowns[key]
			entry.Remaining = (message.Remaining and message.Remaining[key]) or 0
			entry.Total = (message.Totals and message.Totals[key]) or 1
		end
	end)

	RunService.RenderStepped:Connect(function(dt)
		for _, key in ipairs(KEYS) do
			local entry = InputController.Cooldowns[key]
			if entry.Remaining > 0 then
				entry.Remaining = math.max(0, entry.Remaining - dt * InputController.Rate)
			end
		end
		if holdingBasic then
			InputController.Trigger(0)
		end
	end)

	-- ใช้ ContextActionService เพื่อให้คีย์บอร์ด/จอย/ปุ่มมือถือใช้ลอจิกเดียวกัน
	local function skillAction(slot)
		return function(_, state)
			if state == Enum.UserInputState.Begin then
				InputController.Trigger(slot)
			end
			return Enum.ContextActionResult.Pass
		end
	end

	ContextActionService:BindAction("QA_Basic", function(_, state)
		if state == Enum.UserInputState.Begin then
			InputController.SetHoldingBasic(true)
		elseif state == Enum.UserInputState.End or state == Enum.UserInputState.Cancel then
			InputController.SetHoldingBasic(false)
		end
		return Enum.ContextActionResult.Pass
	end, false, Enum.UserInputType.MouseButton1, Enum.KeyCode.ButtonR2)

	ContextActionService:BindAction("QA_Skill1", skillAction(1), false, Enum.KeyCode.Q, Enum.KeyCode.ButtonX)
	ContextActionService:BindAction("QA_Skill2", skillAction(2), false, Enum.KeyCode.E, Enum.KeyCode.ButtonY)
	ContextActionService:BindAction("QA_Skill3", skillAction(3), false, Enum.KeyCode.R, Enum.KeyCode.ButtonB)
	ContextActionService:BindAction("QA_Dash", skillAction("dash"), false, Enum.KeyCode.LeftShift, Enum.KeyCode.ButtonL2)

	ContextActionService:BindActionAtPriority("QA_Menu", function(_, state)
		if state == Enum.UserInputState.Begin then
			InputController.OpenMenu()
		end
		return Enum.ContextActionResult.Sink
	end, false, Enum.ContextActionPriority.High.Value, Enum.KeyCode.Tab, Enum.KeyCode.ButtonSelect)

	setupDoubleJump()
end

return InputController

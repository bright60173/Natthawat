-- จุดเริ่มต้นฝั่ง client
local Client = script.Parent

local InputController = require(Client.InputController)
local VFXController = require(Client.VFXController)
local LoadoutUI = require(Client.UI.LoadoutUI)
local HUD = require(Client.UI.HUD)
local KillFeed = require(Client.UI.KillFeed)
local MobileButtons = require(Client.UI.MobileButtons)

VFXController.Init()
LoadoutUI.Init()
HUD.Init(InputController)
KillFeed.Init()

InputController.SetMenuHandler(LoadoutUI.Toggle)
InputController.SetBlocked(LoadoutUI.IsOpen)
InputController.Init()
MobileButtons.Init(InputController)

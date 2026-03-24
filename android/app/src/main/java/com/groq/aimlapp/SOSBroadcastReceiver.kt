package com.groq.aimlapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class SOSBroadcastReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "SOSBroadcastReceiver"
        
        // Power button press tracking
        var powerPressCount = 0
        var lastPowerPressTime = 0L
        private const val POWER_PRESS_THRESHOLD = 4 // presses needed
        private const val POWER_PRESS_TIMEOUT = 1000L // 1 second timeout
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Broadcast received: ${intent.action}")

        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED -> {
                // Start SOS service on boot
                Log.d(TAG, "Device booted, starting SOS service")
                startSOSService(context)
            }
            
            Intent.ACTION_USER_PRESENT -> {
                // User unlocked the device
                Log.d(TAG, "User present, device unlocked")
            }
            
            Intent.ACTION_SCREEN_OFF -> {
                Log.d(TAG, "Screen turned off")
            }
            
            Intent.ACTION_SCREEN_ON -> {
                Log.d(TAG, "Screen turned on")
            }
            
            "android.intent.action.QUICKBOOT_POWERON" -> {
                // Some devices use this instead of BOOT_COMPLETED
                startSOSService(context)
            }
            
            SOSBackgroundService.ACTION_STOP_SOS -> {
                val stopIntent = Intent(context, SOSBackgroundService::class.java).apply {
                    action = SOSBackgroundService.ACTION_STOP_SOS
                }
                context.startService(stopIntent)
            }
            
            else -> {
                // Check for power button presses
                if (intent.action == Intent.ACTION_CLOSE_SYSTEM_DIALOGS) {
                    handlePowerButtonPress(context)
                }
            }
        }
    }

    private fun handlePowerButtonPress(context: Context) {
        val currentTime = System.currentTimeMillis()
        
        // Reset count if too much time has passed
        if (currentTime - lastPowerPressTime > POWER_PRESS_TIMEOUT) {
            powerPressCount = 0
        }
        
        powerPressCount++
        lastPowerPressTime = currentTime
        
        Log.d(TAG, "Power button pressed: $powerPressCount times")
        
        // Trigger SOS if threshold reached
        if (powerPressCount >= POWER_PRESS_THRESHOLD) {
            powerPressCount = 0
            triggerSOS(context)
        }
    }

    private fun triggerSOS(context: Context) {
        Log.d(TAG, "SOS triggered via power button sequence!")
        
        // Start the SOS service
        val serviceIntent = Intent(context, SOSBackgroundService::class.java).apply {
            action = SOSBackgroundService.ACTION_TRIGGER_SOS
        }
        context.startForegroundService(serviceIntent)
        
        // Also notify the app via broadcast
        val broadcastIntent = Intent("com.groq.aimlapp.SOS_TRIGGERED")
        broadcastIntent.putExtra("source", "power_button")
        context.sendBroadcast(broadcastIntent)
    }

    private fun startSOSService(context: Context) {
        val serviceIntent = Intent(context, SOSBackgroundService::class.java)
        context.startForegroundService(serviceIntent)
    }
}

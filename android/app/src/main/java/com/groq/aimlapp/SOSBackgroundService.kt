package com.groq.aimlapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat

class SOSBackgroundService : Service() {
    companion object {
        const val CHANNEL_ID = "sos_service_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_TRIGGER_SOS = "com.groq.aimlapp.TRIGGER_SOS"
        const val ACTION_STOP_SOS = "com.groq.aimlapp.STOP_SOS"
        const val ACTION_CHECK_BATTERY = "com.groq.aimlapp.CHECK_BATTERY"
        
        private const val TAG = "SOSBackgroundService"
        
        // Battery thresholds
        private const val CRITICAL_BATTERY_THRESHOLD = 10
        private const val LOW_BATTERY_THRESHOLD = 20
    }

    private var wakeLock: PowerManager.WakeLock? = null
    private var batteryLevel: Int = 100
    private var isLowBatteryMode: Boolean = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        acquireWakeLock()
        updateBatteryStatus()
        Log.d(TAG, "SOS Background Service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_TRIGGER_SOS -> {
                Log.d(TAG, "SOS triggered from background service")
                triggerSOS()
            }
            ACTION_STOP_SOS -> {
                Log.d(TAG, "Stopping SOS service")
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
            ACTION_CHECK_BATTERY -> {
                // Check battery and adjust tracking behavior
                updateBatteryStatus()
                handleBatteryOptimization()
            }
            else -> {
                // Start as foreground service
                startForeground(NOTIFICATION_ID, createNotification())
                Log.d(TAG, "SOS Background Service started")
                
                // Start battery monitoring
                startBatteryMonitoring()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        releaseWakeLock()
        Log.d(TAG, "SOS Background Service destroyed")
    }

    // Update battery status
    private fun updateBatteryStatus() {
        val batteryIntent = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        batteryLevel = batteryIntent?.let { intent ->
            val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
            val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
            if (level >= 0 && scale > 0) {
                (level * 100) / scale
            } else {
                100
            }
        } ?: 100
        
        isLowBatteryMode = batteryLevel < LOW_BATTERY_THRESHOLD
        
        Log.d(TAG, "Battery level: $batteryLevel%, Low battery mode: $isLowBatteryMode")
    }

    // Handle battery optimization based on level
    private fun handleBatteryOptimization() {
        when {
            batteryLevel < CRITICAL_BATTERY_THRESHOLD -> {
                // Critical battery - send last location and stop tracking
                Log.w(TAG, "Critical battery level - optimizing for emergency calls only")
                sendCriticalBatteryAlert()
            }
            batteryLevel < LOW_BATTERY_THRESHOLD -> {
                // Low battery - reduce tracking frequency
                Log.d(TAG, "Low battery - reducing tracking frequency")
                updateNotificationWithBatteryWarning()
            }
            else -> {
                // Normal battery - standard tracking
                Log.d(TAG, "Normal battery - standard tracking")
            }
        }
    }

    // Start periodic battery monitoring
    private fun startBatteryMonitoring() {
        // Battery will be checked periodically
        // The interval depends on current battery level
    }

    // Get optimal tracking interval based on battery
    fun getOptimalTrackingInterval(): Long {
        return when {
            batteryLevel < CRITICAL_BATTERY_THRESHOLD -> 60000L // 1 minute
            batteryLevel < LOW_BATTERY_THRESHOLD -> 30000L // 30 seconds
            else -> 10000L // 10 seconds - normal
        }
    }

    // Check if tracking should continue
    fun shouldContinueTracking(): Boolean {
        // Don't stop tracking while charging
        val batteryIntent = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || 
                        status == BatteryManager.BATTERY_STATUS_FULL
        
        if (isCharging) return true
        
        // Stop tracking only at critical battery levels
        return batteryLevel >= CRITICAL_BATTERY_THRESHOLD
    }

    private fun sendCriticalBatteryAlert() {
        // This would trigger a notification to the app
        // to send an emergency SMS about low battery
        val broadcastIntent = Intent("com.groq.aimlapp.CRITICAL_BATTERY")
        broadcastIntent.putExtra("battery_level", batteryLevel)
        sendBroadcast(broadcastIntent)
    }

    private fun updateNotificationWithBatteryWarning() {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("⚠️ SOS Protection - Low Battery")
            .setContentText("Battery is at $batteryLevel%. Tracking optimized to save power.")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setOngoing(true)
            .build()

        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SOS Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background SOS monitoring service"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, SOSBroadcastReceiver::class.java).apply {
            action = ACTION_STOP_SOS
        }
        val stopPendingIntent = PendingIntent.getBroadcast(
            this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SOS Protection Active")
            .setContentText("Your safety is being monitored")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopPendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun triggerSOS() {
        // Send broadcast to trigger SOS in the app
        val broadcastIntent = Intent("com.groq.aimlapp.SOS_TRIGGERED")
        broadcastIntent.putExtra("source", "background_service")
        sendBroadcast(broadcastIntent)

        // Show SOS notification
        showSOSNotification()
        
        // Vibrate
        val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as android.os.Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(android.os.VibrationEffect.createWaveform(
                longArrayOf(0, 500, 200, 500, 200, 500), -1
            ))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(longArrayOf(0, 500, 200, 500, 200, 500), -1)
        }
    }

    private fun showSOSNotification() {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("sos_triggered", true)
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SOS EMERGENCY!")
            .setContentText("Tap to view emergency options")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setVibrate(longArrayOf(0, 1000, 500, 1000, 500, 1000))
            .build()

        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID + 1, notification)
    }

    private fun acquireWakeLock() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "AIMLApp:SOSWakeLock"
        ).apply {
            acquire(10 * 60 * 1000L) // 10 minutes max
        }
    }

    private fun releaseWakeLock() {
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        wakeLock = null
    }
}

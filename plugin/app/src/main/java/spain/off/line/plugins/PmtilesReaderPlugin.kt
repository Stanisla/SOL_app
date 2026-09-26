package spain.off.line.plugins

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.RandomAccessFile
import android.util.Base64

@CapacitorPlugin(name = "PmtilesReader")
class PmtilesReaderPlugin : Plugin() {

    @PluginMethod
    fun readRange(call: PluginCall) {
        val path = call.getString("path") ?: return call.reject("path required")
        val offset = call.getInt("offset")?.toLong() ?: return call.reject("offset required")
        val length = call.getInt("length") ?: return call.reject("length required")

        try {
            RandomAccessFile(path, "r").use { raf ->
                raf.seek(offset)
                val buffer = ByteArray(length)
                raf.readFully(buffer)
                val ret = JSObject()
                ret.put("data", Base64.encodeToString(buffer, Base64.NO_WRAP))
                call.resolve(ret)
            }
        } catch (e: Exception) {
            call.reject("readRange failed: ${e.message}", e)
        }
    }
}

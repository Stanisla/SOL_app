package spain.off.line;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import spain.off.line.plugins.PmtilesReaderPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PmtilesReaderPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

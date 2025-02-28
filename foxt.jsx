// Foxt - Dynamic Font Cycling Plugin for After Effects
// This script automatically cycles through all fonts installed on your system for selected text layers

(function() {
    var mainPanel = (this instanceof Panel) ? this : new Window("palette", "Foxt", undefined);
    mainPanel.orientation = "column";
    mainPanel.alignChildren = ["center", "top"];
    mainPanel.spacing = 10;
    mainPanel.margins = 16;

    var controlGroup = mainPanel.add("group", undefined, "Controls");
    controlGroup.orientation = "row";
    controlGroup.spacing = 10;

    var startButton = controlGroup.add("button", undefined, "Start Cycling");
    var stopButton = controlGroup.add("button", undefined, "Stop");
    stopButton.enabled = false;

    var intervalGroup = mainPanel.add("group");
    intervalGroup.orientation = "row";
    intervalGroup.spacing = 10;
    
    intervalGroup.add("statictext", undefined, "Change Interval (seconds):");
    var intervalInput = intervalGroup.add("edittext", undefined, "1.0");
    intervalInput.characters = 5;

    var statusText = mainPanel.add("statictext", undefined, "Ready to start");
    statusText.alignment = ["fill", "top"];

    var cycleTimer = null;
    var isRunning = false;
    var currentFontIndex = 0;
    var systemFonts = [];
    
    // Function to get all available fonts from the system - safer implementation
    function getSystemFonts() {
        var fonts = [];
        
        try {
            if (app.fonts && app.fonts.length > 0) {
                // Extract unique font families
                for (var i = 0; i < app.fonts.length; i++) {
                    if (app.fonts[i] && app.fonts[i].family) {
                        var fontFamily = app.fonts[i].family;
                        if (fonts.indexOf(fontFamily) === -1) {
                            fonts.push(fontFamily);
                        }
                    }
                }
            } else {
                // Fallback to common fonts if app.fonts is not available
                fonts = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Tahoma", "Trebuchet MS"];
                statusText.text = "Using fallback fonts (app.fonts not available)";
            }
        } catch (e) {
            // Fallback to common fonts if there's an error
            fonts = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Tahoma", "Trebuchet MS"];
            statusText.text = "Error accessing fonts: " + e.toString();
        }
        
        return fonts;
    }
    
    // Initialize system fonts array with error handling
    try {
        systemFonts = getSystemFonts();
        statusText.text = "Found " + systemFonts.length + " font families";
    } catch (e) {
        systemFonts = ["Arial", "Helvetica", "Times New Roman", "Courier New"];
        statusText.text = "Error initializing fonts: " + e.toString();
    }
    
    function getSelectedTextLayers() {
        var textLayers = [];
        try {
            var comp = app.project.activeItem;
            if (comp && comp instanceof CompItem) {
                for (var i = 0; i < comp.selectedLayers.length; i++) {
                    var layer = comp.selectedLayers[i];
                    if (layer instanceof TextLayer) {
                        textLayers.push(layer);
                    }
                }
            }
        } catch (e) {
            statusText.text = "Error getting text layers: " + e.toString();
        }
        return textLayers;
    }
    
    function cycleFonts() {
        app.beginUndoGroup("Cycle Fonts");
        try {
            var textLayers = getSelectedTextLayers();
            if (textLayers.length === 0) {
                statusText.text = "No text layers selected!";
                stopCycling();
                return;
            }
            
            if (systemFonts.length === 0) {
                statusText.text = "No fonts found on the system!";
                stopCycling();
                return;
            }
            
            var selectedFont = systemFonts[currentFontIndex % systemFonts.length];
            
            for (var i = 0; i < textLayers.length; i++) {
                var textProp = textLayers[i].property("Source Text");
                var textDocument = textProp.value;
                textDocument.font = selectedFont;
                textProp.setValue(textDocument);
            }
            
            statusText.text = "Applied: " + selectedFont + " (" + (currentFontIndex % systemFonts.length + 1) + "/" + systemFonts.length + ")";
            currentFontIndex++;
        } catch (err) {
            statusText.text = "Error: " + err.toString();
        }
        app.endUndoGroup();
    }
    
    // Make the function available globally for the scheduler
    $.global.cycleFonts = cycleFonts;
    
    function startCycling() {
        if (!isRunning) {
            var interval = parseFloat(intervalInput.text) * 1000;
            if (isNaN(interval) || interval <= 0) {
                alert("Please enter a valid interval greater than 0");
                return;
            }
            
            isRunning = true;
            startButton.enabled = false;
            stopButton.enabled = true;
            intervalInput.enabled = false;
            
            cycleFonts();
            cycleTimer = app.scheduleTask("$.global.cycleFonts()", interval, true);
            statusText.text = "Cycling through " + systemFonts.length + " fonts every " + intervalInput.text + " seconds";
        }
    }
    
    function stopCycling() {
        if (isRunning) {
            isRunning = false;
            startButton.enabled = true;
            stopButton.enabled = false;
            intervalInput.enabled = true;
            if (cycleTimer) {
                cycleTimer.cancel();
                cycleTimer = null;
            }
            statusText.text = "Font cycling stopped";
        }
    }
    
    startButton.onClick = startCycling;
    stopButton.onClick = stopCycling;
    
    if (!(this instanceof Panel)) {
        mainPanel.center();
        mainPanel.show();
    }
    
    return mainPanel;
}());
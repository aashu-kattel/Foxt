// Font Cycling Plugin for After Effects
// This script automatically cycles through available font styles for selected text layers

(function() {
    // Create the main panel
    var mainPanel = (this instanceof Panel) ? this : new Window("palette", "Font Cycler", undefined);
    mainPanel.orientation = "column";
    mainPanel.alignChildren = ["center", "top"];
    mainPanel.spacing = 10;
    mainPanel.margins = 16;

    // Create group for cycle controls
    var controlGroup = mainPanel.add("group", undefined, "Controls");
    controlGroup.orientation = "row";
    controlGroup.alignChildren = ["left", "center"];
    controlGroup.spacing = 10;

    // Create UI elements
    var startButton = controlGroup.add("button", undefined, "Start Cycling");
    var stopButton = controlGroup.add("button", undefined, "Stop");
    stopButton.enabled = false;

    // Interval controls
    var intervalGroup = mainPanel.add("group", undefined, "Interval");
    intervalGroup.orientation = "row";
    intervalGroup.alignChildren = ["left", "center"];
    intervalGroup.spacing = 10;
    
    intervalGroup.add("statictext", undefined, "Change Interval (seconds):");
    var intervalInput = intervalGroup.add("edittext", undefined, "1.0");
    intervalInput.characters = 5;

    // Font family selection
    var fontGroup = mainPanel.add("panel", undefined, "Font Families to Include");
    fontGroup.orientation = "column";
    fontGroup.alignChildren = ["left", "top"];
    fontGroup.spacing = 5;
    fontGroup.margins = 10;

    // Get system fonts
    var systemFonts = app.fonts;
    var fontFamilies = [];
    var fontCheckboxes = {};
    
    // Extract unique font families
    for (var i = 0; i < systemFonts.length; i++) {
        var fontFamily = systemFonts[i].family;
        if (fontFamilies.indexOf(fontFamily) === -1) {
            fontFamilies.push(fontFamily);
        }
    }
    
    // Sort alphabetically
    fontFamilies.sort();
    
    // Create a scrollable list view for font families
    var fontListContainer = fontGroup.add("group");
    fontListContainer.orientation = "column";
    fontListContainer.alignChildren = ["left", "top"];
    
    var fontScroll = fontListContainer.add("scrollbar", undefined, 0, 0, 100);
    fontScroll.size = [300, 200];
    
    // Add some popular fonts as checkboxes
    var popularFonts = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Tahoma", "Trebuchet MS"];
    
    for (var i = 0; i < popularFonts.length; i++) {
        if (fontFamilies.indexOf(popularFonts[i]) !== -1) {
            var cb = fontGroup.add("checkbox", undefined, popularFonts[i]);
            cb.value = true;
            fontCheckboxes[popularFonts[i]] = cb;
        }
    }
    
    // Add "Select all" and "Clear all" buttons
    var selectGroup = fontGroup.add("group");
    selectGroup.orientation = "row";
    
    var selectAllButton = selectGroup.add("button", undefined, "Select All");
    var clearAllButton = selectGroup.add("button", undefined, "Clear All");
    
    selectAllButton.onClick = function() {
        for (var family in fontCheckboxes) {
            fontCheckboxes[family].value = true;
        }
    };
    
    clearAllButton.onClick = function() {
        for (var family in fontCheckboxes) {
            fontCheckboxes[family].value = false;
        }
    };

    // Status text
    var statusText = mainPanel.add("statictext", undefined, "Ready to start");
    statusText.alignment = ["fill", "top"];

    // Variables for the cycling functionality
    var cycleTimer = null;
    var isRunning = false;
    var currentFontIndex = 0;
    var selectedFonts = [];
    
    // Function to get selected text layers
    function getSelectedTextLayers() {
        var textLayers = [];
        var comp = app.project.activeItem;
        
        if (comp && comp instanceof CompItem) {
            for (var i = 1; i <= comp.selectedLayers.length; i++) {
                var layer = comp.selectedLayers[i-1];
                if (layer instanceof TextLayer) {
                    textLayers.push(layer);
                }
            }
        }
        
        return textLayers;
    }
    
    // Function to get all font styles for a font family
    function getFontStylesForFamily(family) {
        var styles = [];
        
        for (var i = 0; i < systemFonts.length; i++) {
            if (systemFonts[i].family === family) {
                styles.push(systemFonts[i].style);
            }
        }
        
        return styles;
    }
    
    // Function to cycle fonts
    function cycleFonts() {
        app.beginUndoGroup("Cycle Fonts");
        
        try {
            var textLayers = getSelectedTextLayers();
            
            if (textLayers.length === 0) {
                statusText.text = "No text layers selected!";
                stopCycling();
                return;
            }
            
            // Update selected fonts list
            selectedFonts = [];
            for (var family in fontCheckboxes) {
                if (fontCheckboxes[family].value) {
                    selectedFonts.push(family);
                }
            }
            
            if (selectedFonts.length === 0) {
                statusText.text = "No fonts selected!";
                stopCycling();
                return;
            }
            
            // Get the next font family
            var currentFontFamily = selectedFonts[currentFontIndex % selectedFonts.length];
            var fontStyles = getFontStylesForFamily(currentFontFamily);
            
            // Apply to all selected text layers
            for (var i = 0; i < textLayers.length; i++) {
                var textLayer = textLayers[i];
                var textProp = textLayer.property("Source Text");
                var textDocument = textProp.value;
                
                // Select a random style from this font family
                var randomStyleIndex = Math.floor(Math.random() * fontStyles.length);
                var fontStyle = fontStyles[randomStyleIndex];
                
                textDocument.font = currentFontFamily + "\t" + fontStyle;
                textProp.setValue(textDocument);
            }
            
            statusText.text = "Applied: " + currentFontFamily + " - " + fontStyles[randomStyleIndex];
            currentFontIndex++;
            
        } catch (err) {
            statusText.text = "Error: " + err.toString();
        }
        
        app.endUndoGroup();
    }
    
    // Function to start cycling
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
            
            cycleFonts(); // Run immediately once
            
            // Set up timer for continuous cycling
            cycleTimer = app.scheduleTask("cycleFonts()", interval, true);
            statusText.text = "Cycling fonts every " + intervalInput.text + " seconds";
        }
    }
    
    // Function to stop cycling
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
    
    // Event handlers
    startButton.onClick = startCycling;
    stopButton.onClick = stopCycling;
    
    // Show the panel
    if (!(this instanceof Panel)) {
        mainPanel.center();
        mainPanel.show();
    }
    
    return mainPanel;
}());
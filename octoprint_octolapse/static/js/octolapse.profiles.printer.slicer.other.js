Octolapse.OtherSlicerExtruderViewModel = function (values, extruder_index) {
    var self=this;
    self.index = extruder_index;
    self.retract_length = ko.observable(null);
    self.z_hop = ko.observable(null);
    self.retract_speed = ko.observable(null);
    self.deretract_speed = ko.observable(null);
    self.travel_speed = ko.observable(null);
    self.z_travel_speed = ko.observable(null);
    self.retract_before_move = ko.observable(null);

    if (values && values.extruders.length > self.index) {
        var extruder = values.extruders[self.index];
        if (!extruder)
            return;
        self.retract_length(extruder.retract_length);
        self.z_hop(extruder.z_hop);
        self.retract_speed(extruder.retract_speed);
        self.deretract_speed(extruder.deretract_speed);
        self.travel_speed(extruder.travel_speed);
        self.z_travel_speed(extruder.z_travel_speed);
        self.retract_before_move(extruder.retract_before_move);
    }

    self.lift_when_retracted = ko.pureComputed(function () {
        if (self.retract_before_move() && self.z_hop() != null && self.z_hop() > 0)
            return true;
        return false;
    }, self);
};

Octolapse.OtherSlicerViewModel = function (values, num_extruders_observable) {
    var self = this;
    // Observables
    self.num_extruders_observable = num_extruders_observable;
    self.extruders = ko.observableArray();
    for (var index = 0; index < self.num_extruders_observable(); index++)
    {
        self.extruders.push(new Octolapse.OtherSlicerExtruderViewModel(values, index))
    }

    self.speed_tolerance = ko.observable(values.speed_tolerance);
    self.vase_mode = ko.observable(values.vase_mode);
    self.layer_height = ko.observable(values.layer_height);
    self.axis_speed_display_units = ko.observable(values.axis_speed_display_units);

    // Declare constants
    self.round_to_increment_mm_min = 0.001;
    self.round_to_increment_mm_sec = 0.000001;

    self.num_extruders_observable.subscribe(function() {
        var num_extruders = self.num_extruders_observable();
        if (num_extruders < 1) {
            num_extruders = 1;
        }
        else if (num_extruders > 16){
            num_extruders = 16;
        }
        while(self.extruders().length < num_extruders)
        {
            var new_extruder = new Octolapse.OtherSlicerExtruderViewModel(null, self.extruders().length-1);
            self.extruders.push(new_extruder);
        }
        while(self.extruders().length > num_extruders)
        {
             self.extruders.pop();
        }
    });

    // get the time component of the axis speed units (min/mm)
    self.getAxisSpeedTimeUnit = ko.pureComputed(function () {
        if (self.axis_speed_display_units() === "mm-min")
            return 'min';
        if (self.axis_speed_display_units() === "mm-sec")
            return 'sec';
        return '?';
    }, self);

    self.axisSpeedDisplayUnitsChanged = function (obj, event) {

        if (Octolapse.Globals.is_admin()) {
            if (event.originalEvent) {
                // Get the current guid
                var newUnit = $("#octolapse_axis_speed_display_unit_options").val();
                var previousUnit = self.axis_speed_display_units();
                if (newUnit === previousUnit) {
                    //console.log("Axis speed display units, no change detected!")
                    return false;
                }
                //console.log("Changing axis speed from " + previousUnit + " to " + newUnit)
                // in case we want to have more units in the future, check all cases
                // Convert all from mm-min to mm-sec

                var axis_speed_round_to_increment = 0.000001;
                var axis_speed_round_to_unit = 'mm-sec';
                self.speed_tolerance(Octolapse.convertAxisSpeedUnit(self.speed_tolerance(), newUnit, previousUnit, axis_speed_round_to_increment, axis_speed_round_to_unit));
                for (var i=0; i < self.extruders().length; i++) {
                    var extruder = self.extruders()[i];

                    extruder.retract_speed(Octolapse.convertAxisSpeedUnit(self.retract_speed(), newUnit, previousUnit, self.round_to_increment_mm_min, previousUnit));
                    extruder.deretract_speed(Octolapse.convertAxisSpeedUnit(self.deretract_speed(), newUnit, previousUnit, self.round_to_increment_mm_min, previousUnit));
                    extruder.travel_speed(Octolapse.convertAxisSpeedUnit(self.travel_speed(), newUnit, previousUnit, self.round_to_increment_mm_min, previousUnit));
                    extruder.z_travel_speed(Octolapse.convertAxisSpeedUnit(self.z_travel_speed(), newUnit, previousUnit, self.round_to_increment_mm_min, previousUnit));
                    // Optional values
                }
                return true;
            }
        }
    };
};

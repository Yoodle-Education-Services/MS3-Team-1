//const { parse } = require('dotenv/types');
const mongoose = require('mongoose');
const Loc = mongoose.model('Location');

const _buildLocationList = (req, res, results, stats) => {
    let locations = [];
    results.forEach((doc) => {
        locations.push({
            distance: `${doc.dist.calculated}`,
            name: doc.name,
            address: doc.address,
            services: doc.services,
            _id: doc._id,
        });
    });
    return locations;
};

const locationsListByDistance = async (req, res) => { 
    const lng = parseFloat(req.query.lng);
    const lat = parseFloat(req.query.lat);
    const point = {
        type: "Point",
        coordinates: [lng, lat]
    };
    const geoOptions = {
        distanceField: "dist.calculated",
        key: 'coords',
        spherical: true,
        maxDistance: 40000, //distance is in meters
        //limit: 10
    };
    if (!lng || !lat) {
        console.log('locationsListByDistance missing params');
        res
        .status(404)
        .json({
            "message": "lng and lat paramaters are required"
        });
        return;
    } else {
    Loc.aggregate([
        {
          $geoNear: {
             near: point,
             distanceField: "dist.calculated",
             key: 'coords',
             maxDistance: 40000,
             spherical: true,
          }
        }
     ],//),
     function(err, results, stats) {
         if (err) {
             res
             .status(404)
             .json(err);
         } else {
             console.log('PRINT RESULTS', results);
             locations = _buildLocationList(req, res, results, stats);
             console.log('Geo results', results);
             console.log('Geo stats', stats);
             res.status(200).json(locations);
             
         }
     }
     )
    };
};

const locationReadOne = (req, res) => {
    Loc
    .findById(req.params.locationid)
    .exec((err, location) => { 
        if(!location) {
            return res
            .status(404)
            .json({
                "message": "location not found"
            });
        } else if(err) {
            return res.status(404).json(err);
        }
        res.status(200).json(location);
    });
};

const createLocation = (req, res) => {
    Loc.create({
        name:req.body.name,
        address:req.body.address,
        coords: {
            type: "Point",
            coordinates: [parseFloat(req.body.lng),
                         parseFloat(req.body.lat)]
        },
        services: [{
            vaccine: req.body.vaccine,
            rapidTest: req.body.rapidTest,
            test: req.body.test
        }]
    }, (err, location) => {
        if (err) {
            res.status(404).json(err);
        } else {
            res.status(201).json(location);
        }
    });
};

const deleteLocation = (req, res) => {
    const {locationid} = req.params;
    if (locationid) {
        Loc.findByIdAndRemove(locationid)
        .exec((err, location) => {
            if (err) {
                return res
                .status(404)
                .json(err);
            }
            res
            .status(204)
            .json({"message" : "Location Deleted"});
        });
    } else {
        return res
        .status(404)
        .json({"message" : "No Location Found"})
    }

};

const updateLocation = (req, res) => {
    if (!req.params.locationid) {
        return res.response(404).json({"message": "Not found, Location not found."});
    }
    Loc.findById(req.params.locationid).exec((err, location) => {
        if (!location) { 
            return res.response(404).json({"message" : "Location not found"}); 
        } else if (err) {
            return res.response(404).json(err);
        }

        location.name = req.body.name;
        location.address = req.body.address;
        location.coords = { 
            type: "Point", 
            coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)] 
        };
        location.services = {
            vaccine: req.body.vaccine,
            rapidTest: req.body.rapidTest,
            test: req.body.test
        }

        location.save((err, loc) => {
            if (err) { res.status(404).json(err); } 
            else { res.status(200).json(loc); }

        });

    });

};

module.exports = {
    locationsListByDistance,
    locationReadOne,
    createLocation,
    deleteLocation,
    updateLocation
};
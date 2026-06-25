var activeTracks = db.music_metadata.find({}, {_id: 1}).toArray().map(t => t._id.valueOf().toString());
print('Active Tracks:', activeTracks);
var res = db.activityLog.deleteMany({ trackId: { $nin: activeTracks } });
print('Deleted orphaned logs:', res.deletedCount);

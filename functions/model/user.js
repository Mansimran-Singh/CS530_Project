
class User {
    constructor(name) {
        var _name = name;
        this.getName = () => { return _name };
        this.setName = (value) => { _name = value; };
    }
};

exports.User = User;
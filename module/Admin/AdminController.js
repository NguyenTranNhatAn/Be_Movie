const UserModel = require('./UserModel');
const bcrypt = require('bcryptjs');

const register = async (name, email, password) => {
    //1. Taọ user mới
    //2.lưu user mới
    //3. Trả về user mới
    const salt = bcrypt.genSaltSync(10);

    const hash = bcrypt.hashSync(password, salt);
    const user = new UserModel({ name, email, password: hash });
    await user.save();
    return user;
};
const login = async (email, password) => {
    try {
        // Tìm user theo email
        const user = await UserModel.findOne({ email });

        // Kiểm tra xem user có tồn tại không
        if (!user) {
            return null; // Trả về null nếu không tìm thấy user
        }

        // So sánh password đã hash với password người dùng nhập vào
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // Kiểm tra xem mật khẩu có đúng không
        if (!isPasswordValid) {
            return null; // Trả về null nếu mật khẩu không đúng
        }

        // Nếu mọi thứ đều đúng, trả về user
        return user;
    } catch (error) {
        throw error; // Xử lý lỗi nếu có
    }
};

module.exports = { login, register }
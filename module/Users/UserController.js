const UserModel = require('./UserModel');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');


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
const update = async (_id, name, email, address, phone) => {
    try {
        const user = UserModel.findByIdAndUpdate(_id, { name, email, address, phone });

        return user;
    } catch (error) {
        console.log(error);
    }
}
const register = async (_id, name, phone) => {
    try {
        let userid = await UserModel.findById(_id);
        if (!userid) {
            throw new Error('Id không hợp lệ!');
        }

        let checkEmail = await UserModel.findOne({ email });
        if (checkEmail) {
            throw new Error('Email đã được đăng kí');
        }


        let checkPhone = await UserModel.findOne({ phone });
        if (checkPhone) {
            throw new Error('Số điện thoại đã được đăng kí');
        }


        userid.name = name || userid.name;
        userid.email = email || userid.email;
        userid.address = address || userid.address;
        userid.phone = phone || userid.phone;


        await userid.save();


        return userid;

    } catch (error) {

        throw new Error(error.message);
    }
};
const updateUser = async (_id, name, email, address, phone) => {
    try {
        let userid = await UserModel.findById(_id);
        if (!userid) {
            throw new Error('Id không hợp lệ!');
        }

        let checkEmail = await UserModel.findOne({ email });
        if (checkEmail) {
            throw new Error('Email đã được đăng kí');
        }


        let checkPhone = await UserModel.findOne({ phone });
        if (checkPhone) {
            throw new Error('Số điện thoại đã được đăng kí');
        }


        userid.name = name || userid.name;
        userid.email = email || userid.email;
        userid.address = address || userid.address;
        userid.phone = phone || userid.phone;


        await userid.save();


        return userid;

    } catch (error) {

        throw new Error(error.message);
    }
};
const getWishList = async (_id) => {
    try {
        let userid = await UserModel.findById(_id);
        if (!userid) {
            throw new Error('Id không hợp lệ!');
        }
        let wishlist = await UserModel.findById(_id).populate('wishlist');
       

        
        return wishlist;

    } catch (error) {
       
        throw new Error(error.message); 
    }
};
const getAll = async () => {
    try {
        const user = await UserModel.find({}).select('-password');
        return user;
    } catch (error) {
        console.log(error);
    }
    
}

module.exports = { login, update,updateUser ,getAll,getWishList}

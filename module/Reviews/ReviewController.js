const ReviewModel =  require('./ReviewModel');
const bcrypt = require('bcryptjs');

const updateUser = async (_id, name, email, address, phone) => {
    try {
        let userid = await UserModel.findById(_id);
        if (!userid) {
            throw new Error('Id không hợp lệ!');
        }

        let checkEmail = await UserModel.findOne({ email});
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
const add = async (comment,rating,userId,movieId) => {
    const review= new ReviewModel({comment,rating,userId,movieId});
    await review.save()
    return review;
}

module.exports = { add }
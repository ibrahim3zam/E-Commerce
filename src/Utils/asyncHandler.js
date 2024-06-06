import cloudinary from './cloudinaryConfig.js'

export const asyncHandler = (API) => {
    return (req, res, next) => {
        API(req, res, next)
            .catch(async (error) => {
                console.log(error);

                console.log(req.imagePath)
                if (req.imagePath) {
                    //=========== Delete from cloudinary ==============
                    await cloudinary.api.delete_resources_by_prefix(req.imagePath)

                    await cloudinary.api.delete_folder(req.imagePath)
                }
                console.log(req.failedDocument);
                // =========== Delete from DB ==============
                if (req.failedDocument) {
                    const { model, _id } = req.failedDocument
                    await model.findByIdAndDelete(_id)
                }
                res.status(500).json({ Message: "Falied" })
            })
    }
}

export const globalResponse = (err, req, res, next) => {
    if (err) {
        if (req.validationErrorArr) {
            return res
                .status(err['cause'] || 400)
                .json({ message: req.validationErrorArr })
        }

        return res.status(err['cause'] || 500).json({ message: err.message })
    }
}
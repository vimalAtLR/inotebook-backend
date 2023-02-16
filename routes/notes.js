const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const Note = require("../models/Note");
const { body, validationResult } = require("express-validator");

/**
 * @method POST /api/notes/fetchallnotes
 * @description fetch all notes for particular user
 */
router.get("/fetchallnotes", fetchuser, async (req, res) => {
  try {
    // find notes by user's id
    const notes = await Note.find({ user: req.user.id });

    // return response
    return res.json(notes);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      msg: "Internal Server Error",
      err: error,
    });
  }
});

/**
 * @method POST /api/notes/addnote
 * @description create new note
 */
router.post(
  "/addnote",
  fetchuser,
  [
    body("title", "Enter a valid title").isLength({ min: 1 }),
    body("description", "Description must be atleast 5 characters").isLength({
      min: 1,
    }),
  ],
  async (req, res) => {
    try {
      // get data from body
      const { title, description, tag } = req.body;

      // If there are errors, return Bad request and the errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }


      // creating new note
      const note = await Note.create({
        title,
        description,
        tag: tag ? tag : "General",
        user: req.user.id,
      });
      const savedNote = await note.save();

      // return new note
      return res.status(200).json(savedNote);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        msg: "Internal Server Error",
        err: error,
      });
    }
  }
);

/**
 * @method POST /api/notes/updatenote
 * @description update existing note by id
 */
router.put("/updatenote/:id", fetchuser, async (req, res) => {
  try {
    // get data from body
    const { title, description, tag } = req.body;

    // Create a newNote object
    const newNote = {};
    if (title) {
      newNote.title = title;
    }
    if (description) {
      newNote.description = description;
    }
    if (tag) {
      newNote.tag = tag;
    }

    // Find the note to be updated and update it
    let note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).send("Not Found");
    }

    // check is id valid or not
    if (note.user.toString() !== req.user.id) {
      return res.status(401).send("Not Allowed");
    }

    // update note
    note = await Note.findByIdAndUpdate(
      req.params.id,
      { $set: newNote },
      { new: true }
    );

    // return response
    return res.json({ note });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
        msg: "Internal Server Error",
        err: error
    });
  }
});

/**
 * @method POST /api/notes/deletenote/:id
 * @description delete existing note by id
 */
// ROUTE 4: Delete an existing Note using: DELETE "/api/notes/deletenote". Login required
router.delete("/deletenote/:id", fetchuser, async (req, res) => {
  try {
    // Find the note to be delete and delete it
    let note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json("Not Found");
    }

    // Allow deletion only if user owns this Note
    if (note.user.toString() !== req.user.id) {
      return res.status(401).json("Not Allowed");
    }

    note = await Note.findByIdAndDelete(req.params.id);
    return res.json({ Success: "Note has been deleted", note: note });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
        msg: "Internal Server Error",
        err: error
    });  }
});
module.exports = router;

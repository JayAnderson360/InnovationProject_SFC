// js/course-edit-page/api.js - Handles Firestore interactions for the course edit page
console.log("course-edit-page/api.js loaded");

class CourseEditAPI {
    constructor() {
        this.db = window.db; // Assuming firebase-config.js initializes db globally
    }

    async getCourseDetails(courseId) {
        try {
            const docRef = this.db.collection('courses').doc(courseId);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                console.error("No such course document!", courseId);
                return null;
            }
        } catch (error) {
            console.error("Error getting course details: ", error);
            throw error;
        }
    }

    // Placeholder for future update methods
    async updateCourseMetadata(courseId, metadata) {
        console.log("API: Updating metadata for", courseId, metadata);
        // Firestore update logic will go here
        await this.db.collection('courses').doc(courseId).update(metadata);
        console.log("API: Metadata updated successfully.");
    }

    async updateCourseTitle(courseId, title) {
        console.log("API: Updating title for", courseId, title);
        await this.db.collection('courses').doc(courseId).update({ title });
        console.log("API: Title updated successfully.");
    }

    async updateCourseDescription(courseId, description) {
        console.log("API: Updating description for", courseId, description);
        await this.db.collection('courses').doc(courseId).update({ description });
        console.log("API: Description updated successfully.");
    }

    async updatePublishStatus(courseId, published) {
        console.log("API: Updating publish status for", courseId, published);
        await this.db.collection('courses').doc(courseId).update({ published });
        console.log("API: Publish status updated successfully.");
    }

     async addModule(courseId, moduleData) {
        console.log("API: Adding module to", courseId, moduleData);
        // Firestore logic: This is more complex as it involves updating an array or subcollection.
        // For now, let's assume modules are part of the course document in a 'modules' map/object
        // and moduleOrder is an array of module IDs.
        // This will need careful implementation based on actual Firestore structure.
        const courseRef = this.db.collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();
        if (!courseDoc.exists) throw new Error("Course not found");

        const courseData = courseDoc.data();
        const modules = courseData.modules || {};
        const moduleOrder = courseData.moduleOrder || [];

        const newModuleId = `module_${Date.now()}`; // Simple unique ID
        modules[newModuleId] = moduleData;
        moduleOrder.push(newModuleId);

        await courseRef.update({
            modules: modules,
            moduleOrder: moduleOrder
        });
        console.log("API: Module added successfully.");
        return { newModuleId, modules, moduleOrder }; // Return updated data for UI
    }

    async updateModule(courseId, moduleId, moduleData) {
        console.log("API: Updating module", moduleId, "for course", courseId, moduleData);
        const courseRef = this.db.collection('courses').doc(courseId);
        // This requires dot notation for updating a specific field in a map
        await courseRef.update({ [`modules.${moduleId}`]: moduleData });
        console.log("API: Module updated successfully.");
    }

    async deleteModule(courseId, moduleId) {
        console.log("API: Deleting module", moduleId, "from course", courseId);
        const courseRef = this.db.collection('courses').doc(courseId);
        const courseDoc = await courseRef.get();
        if (!courseDoc.exists) throw new Error("Course not found");

        const courseData = courseDoc.data();
        const modules = courseData.modules || {};
        let moduleOrder = courseData.moduleOrder || [];

        delete modules[moduleId];
        moduleOrder = moduleOrder.filter(id => id !== moduleId);

        // Also delete associated tests (if any) - this is a simplification
        // In a real app, you might have a more robust way to handle cascading deletes or test management.
        const testsToDelete = [];
        if (courseData.modules && courseData.modules[moduleId] && courseData.modules[moduleId].testIds) {
            courseData.modules[moduleId].testIds.forEach(testId => testsToDelete.push(testId));
        }
        // This part needs more thought: where are tests stored? If in a separate collection:
        // for (const testId of testsToDelete) {
        //     await this.db.collection('tests').doc(testId).delete();
        // }

        await courseRef.update({
            modules: modules,
            moduleOrder: moduleOrder
            // Potentially clear testIds from other parts of the course if they are stored centrally
        });
        console.log("API: Module deleted successfully.");
        return { modules, moduleOrder }; // Return updated data
    }

    async updateModuleLinks(courseId, moduleId, links) {
        console.log(`API: Updating links for module ${moduleId} in course ${courseId}`, links);
        if (!courseId || !moduleId || !links) {
            console.error("updateModuleLinks: Missing courseId, moduleId, or links object.");
            throw new Error("Missing required parameters to update module links.");
        }

        const courseRef = this.db.collection('courses').doc(courseId);
        const updateData = {};

        if (links.videoLink !== undefined) {
            updateData[`modules.${moduleId}.videoLink`] = links.videoLink;
        }
        if (links.documentLink !== undefined) {
            updateData[`modules.${moduleId}.documentLink`] = links.documentLink;
        }

        if (Object.keys(updateData).length === 0) {
            console.warn("updateModuleLinks: No valid links provided to update.");
            // Optionally, fetch and return current module data if no update is performed
            // For consistency with other update methods, let's assume an update was intended.
            // To be safe, and to allow clearing links, we proceed if links object was passed.
        }

        try {
            await courseRef.update(updateData);
            console.log("Module links updated successfully in Firestore.");

            // Fetch the updated module data to return, ensuring UI gets fresh state
            const updatedDoc = await courseRef.get();
            if (updatedDoc.exists) {
                return { modules: updatedDoc.data().modules }; 
            }
            throw new Error("Failed to retrieve updated course data after link update.");

        } catch (error) {
            console.error("Error in updateModuleLinks:", error);
            throw error;
        }
    }

    async removeModuleLink(courseId, moduleId, linkType) {
        console.log(`API: Removing ${linkType} from module ${moduleId} in course ${courseId}`);
        if (!courseId || !moduleId || !linkType || (linkType !== 'videoLink' && linkType !== 'documentLink')) {
            console.error("removeModuleLink: Missing or invalid parameters.");
            throw new Error("Missing or invalid parameters to remove module link.");
        }

        const courseRef = this.db.collection('courses').doc(courseId);
        const fieldToDelete = `modules.${moduleId}.${linkType}`;

        try {
            // Firestore FieldValue.delete() is used to remove a field from a document
            await courseRef.update({
                [fieldToDelete]: firebase.firestore.FieldValue.delete()
            });

            console.log(`${linkType} removed successfully from module in Firestore.`);

            // Fetch the updated module data to return
            const updatedDoc = await courseRef.get();
            if (updatedDoc.exists) {
                return { modules: updatedDoc.data().modules };
            }
            throw new Error("Failed to retrieve updated course data after link removal.");

        } catch (error) {
            console.error(`Error in removeModuleLink for ${linkType}:`, error);
            throw error;
        }
    }

    async assignTestToModule(courseId, moduleId, testId) {
        console.log(`API: Assigning test ${testId} to module ${moduleId} in course ${courseId}`);
        if (!courseId || !moduleId || !testId) {
            console.error("assignTestToModule: Missing courseId, moduleId, or testId.");
            throw new Error("Missing required parameters to assign test.");
        }

        const courseRef = this.db.collection('courses').doc(courseId);

        try {
            const courseDoc = await courseRef.get();
            if (!courseDoc.exists) {
                throw new Error("Course not found.");
            }

            const courseData = courseDoc.data();
            const modules = courseData.modules || {};
            const module = modules[moduleId];

            if (!module) {
                throw new Error(`Module with ID ${moduleId} not found in course.`);
            }

            if (!module.testIds) {
                module.testIds = [];
            }

            if (module.testIds.includes(testId)) {
                console.warn(`Test ${testId} is already assigned to module ${moduleId}.`);
                // Returning current modules, as no change was made, but UI might expect this structure.
                return { modules: modules }; 
            }

            module.testIds.push(testId);

            await courseRef.update({
                [`modules.${moduleId}.testIds`]: module.testIds
            });

            console.log("Test assigned successfully to module in Firestore.");
            // Return the updated modules object so the UI can refresh correctly.
            return { modules: modules };

        } catch (error) {
            console.error("Error in assignTestToModule:", error);
            throw error;
        }
    }

    async unassignTestFromModule(courseId, moduleId, testId) {
        console.log(`API: Unassigning test ${testId} from module ${moduleId} in course ${courseId}`);
        if (!courseId || !moduleId || !testId) {
            console.error("unassignTestFromModule: Missing courseId, moduleId, or testId.");
            throw new Error("Missing required parameters to unassign test.");
        }

        const courseRef = this.db.collection('courses').doc(courseId);

        try {
            const courseDoc = await courseRef.get();
            if (!courseDoc.exists) {
                throw new Error("Course not found.");
            }

            const courseData = courseDoc.data();
            const modules = courseData.modules || {};
            const module = modules[moduleId];

            if (!module || !module.testIds) {
                console.warn(`Module ${moduleId} or its testIds array not found. No action taken.`);
                return { modules: modules }; // Return current state
            }

            const testIndex = module.testIds.indexOf(testId);
            if (testIndex === -1) {
                console.warn(`Test ${testId} not found in module ${moduleId}'s testIds. No action taken.`);
                return { modules: modules }; // Return current state
            }

            module.testIds.splice(testIndex, 1);

            await courseRef.update({
                [`modules.${moduleId}.testIds`]: module.testIds
            });

            console.log("Test unassigned successfully from module in Firestore.");
            return { modules: modules }; // Return updated modules

        } catch (error) {
            console.error("Error in unassignTestFromModule:", error);
            throw error;
        }
    }

    async getTestDetails(testId) {
        console.log(`API: Getting details for test ${testId}`);
        if (!testId) {
            console.error("getTestDetails: Missing testId.");
            throw new Error("Missing required parameter to get test details.");
        }

        try {
            const docRef = this.db.collection('tests').doc(testId);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                console.warn(`Test document with ID ${testId} not found.`);
                return null; 
            }
        } catch (error) {
            console.error(`Error getting test details for ${testId}:`, error);
            throw error;
        }
    }

    async addQuestionToTest(testId, questionData) {
        console.log(`API: Adding question to test ${testId}`, questionData);
        if (!testId || !questionData || !questionData.text || !questionData.type) {
            console.error("addQuestionToTest: Missing testId or essential question data (text, type).");
            throw new Error("Missing required parameters to add question.");
        }

        const testRef = this.db.collection('tests').doc(testId);

        try {
            const testDoc = await testRef.get();
            if (!testDoc.exists) {
                throw new Error(`Test with ID ${testId} not found. Cannot add question.`);
            }

            const testData = testDoc.data();
            const questions = testData.questions || {};

            // Generate a unique ID for the new question, e.g., QMC + timestamp or similar
            // For simplicity, using a timestamp-based ID. Consider a more robust UUID if needed.
            const newQuestionId = `Q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            questions[newQuestionId] = {
                text: questionData.text,
                type: questionData.type,
                // Add options and correctAnswer only if they exist in questionData (as per type)
                ...(questionData.options && { options: questionData.options }),
                ...(questionData.correctAnswer && { correctAnswer: questionData.correctAnswer }),
                // id: newQuestionId, // Optionally store the ID within the question object itself too
            };
            
            // Increment questionCount if it exists
            const questionCount = (testData.questionCount || 0) + 1;

            await testRef.update({
                questions: questions,
                questionCount: questionCount
            });

            console.log(`Question ${newQuestionId} added successfully to test ${testId}.`);
            return { newQuestionId, questions, questionCount }; // Return new state for UI if needed

        } catch (error) {
            console.error(`Error adding question to test ${testId}:`, error);
            throw error;
        }
    }

    async deleteQuestionFromTest(testId, questionId) {
        console.log(`API: Deleting question ${questionId} from test ${testId}`);
        if (!testId || !questionId) {
            console.error("deleteQuestionFromTest: Missing testId or questionId.");
            throw new Error("Missing required parameters to delete question.");
        }

        const testRef = this.db.collection('tests').doc(testId);

        try {
            const testDoc = await testRef.get();
            if (!testDoc.exists) {
                throw new Error(`Test with ID ${testId} not found. Cannot delete question.`);
            }
            const testData = testDoc.data();
            
            // Using Firestore dot notation to remove a field from a map
            // and FieldValue.increment to decrease questionCount
            const updates = {};
            updates[`questions.${questionId}`] = firebase.firestore.FieldValue.delete();
            updates.questionCount = firebase.firestore.FieldValue.increment(-1);

            await testRef.update(updates);

            console.log(`Question ${questionId} deleted successfully from test ${testId}.`);
            // No specific data needs to be returned other than success, 
            // as UI will re-fetch or can assume success.
            return { success: true }; 

        } catch (error) {
            console.error(`Error deleting question ${questionId} from test ${testId}:`, error);
            throw error;
        }
    }

    async updateQuestionInTest(testId, questionId, questionData) {
        console.log(`API: Updating question ${questionId} in test ${testId}`, questionData);
        if (!testId || !questionId || !questionData || !questionData.text || !questionData.type) {
            console.error("updateQuestionInTest: Missing testId, questionId or essential question data (text, type).");
            throw new Error("Missing required parameters to update question.");
        }

        const testRef = this.db.collection('tests').doc(testId);

        try {
            const testDoc = await testRef.get();
            if (!testDoc.exists) {
                throw new Error(`Test with ID ${testId} not found. Cannot update question.`);
            }

            const testData = testDoc.data();
            const questions = testData.questions || {};

            if (!questions[questionId]) {
                throw new Error(`Question with ID ${questionId} not found in test ${testId}.`);
            }

            // Update the specific question in the questions object
            const updatedQuestion = {
                text: questionData.text,
                type: questionData.type,
                // Add options and correctAnswer only if they exist in questionData (as per type)
                ...(questionData.options && { options: questionData.options }),
                ...(questionData.correctAnswer && { correctAnswer: questionData.correctAnswer }),
            };

            await testRef.update({
                [`questions.${questionId}`]: updatedQuestion
            });

            console.log(`Question ${questionId} updated successfully in test ${testId}.`);
            return { success: true, updatedQuestion };

        } catch (error) {
            console.error(`Error updating question ${questionId} in test ${testId}:`, error);
            throw error;
        }
    }
}

window.courseEditAPI = new CourseEditAPI();
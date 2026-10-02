/* =========================================================
   MSONGOLA RESULT SYSTEM
   ADMIN SCHOOL SETTINGS
   FRONTEND FUNCTIONALITY
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const DEFAULT_SETTINGS = {
        school_name: "MSONGOLA SECONDARY SCHOOL",
        po_box: "P.O BOX 104727",
        motto: "Education is Light",
        head_of_school: "NASSORO SHEKULAMBA",
        phone: "",
        email: ""
    };


    /* =====================================================
       DOM ELEMENTS
    ===================================================== */

    const form =
        document.getElementById("schoolSettingsForm");

    const schoolNameInput =
        document.getElementById("schoolNameInput");

    const schoolBoxInput =
        document.getElementById("schoolBoxInput");

    const schoolMottoInput =
        document.getElementById("schoolMottoInput");

    const headOfSchoolInput =
        document.getElementById("headOfSchoolInput");

    const schoolPhoneInput =
        document.getElementById("schoolPhoneInput");

    const schoolEmailInput =
        document.getElementById("schoolEmailInput");

    const resetButton =
        document.getElementById(
            "resetSchoolSettingsButton"
        );

    const saveButton =
        document.getElementById(
            "saveSchoolSettingsButton"
        );


    /* Preview */

    const previewSchoolName =
        document.querySelector(
            ".preview-school-name"
        );

    const previewBox =
        document.querySelector(
            ".preview-box"
        );

    const previewContact =
        document.querySelector(".preview-contact");

    const previewSchoolPhone =
        document.querySelector(".preview-school-phone");

    const previewSchoolEmail =
        document.querySelector(".preview-school-email");

    const previewMotto =
        document.querySelector(
            ".preview-motto"
        );

    const previewHead =
        document.querySelector(
            ".preview-head strong"
        );


    /* Toast */

    const toast =
        document.getElementById(
            "schoolSettingsToast"
        );

    const toastIcon =
        document.getElementById(
            "schoolToastIcon"
        );

    const toastTitle =
        document.getElementById(
            "schoolToastTitle"
        );

    const toastMessage =
        document.getElementById(
            "schoolToastMessage"
        );

    const closeToastButton =
        document.getElementById(
            "closeSchoolToastButton"
        );


    /* =====================================================
       STATE
    ===================================================== */

    let savedSettings = {
        ...DEFAULT_SETTINGS
    };

    let toastTimer = null;


    /* =====================================================
       PAGE PROTECTION
    ===================================================== */

    async function protectPage() {

        if (!window.MsongolaAuth) {
            console.error(
                "MsongolaAuth haijapatikana."
            );

            return false;
        }

        const allowed =
            await MsongolaAuth.protectPage({
                roles: ["ADMIN"]
            });

        if (!allowed) {
            return false;
        }

        return true;
    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function normalizeValue(value, fallback = "") {

        if (
            value === null ||
            value === undefined
        ) {
            return fallback;
        }

        return String(value).trim();
    }


    function extractSettings(response) {

        if (!response) {
            return null;
        }


        /* ---------------------------------------------
           Possible response:

           {
               success: true,
               data: {
                   school_name: ...
               }
           }
        --------------------------------------------- */

        if (
            response.data &&
            typeof response.data === "object" &&
            !Array.isArray(response.data)
        ) {

            if (
                response.data.settings &&
                typeof response.data.settings === "object"
            ) {
                return response.data.settings;
            }

            if (
                response.data.school &&
                typeof response.data.school === "object"
            ) {
                return response.data.school;
            }

            if (
                response.data.schoolSettings &&
                typeof response.data.schoolSettings === "object"
            ) {
                return response.data.schoolSettings;
            }

            if (
                response.data.school_name !== undefined ||
                response.data.po_box !== undefined ||
                response.data.motto !== undefined ||
                response.data.head_of_school !== undefined ||
                response.data.phone !== undefined ||
                response.data.email !== undefined
            ) {
                return response.data;
            }
        }


        /* ---------------------------------------------
           Possible response:

           {
               success: true,
               settings: {...}
           }
        --------------------------------------------- */

        if (
            response.settings &&
            typeof response.settings === "object"
        ) {
            return response.settings;
        }


        /* ---------------------------------------------
           Possible response:

           {
               success: true,
               school: {...}
           }
        --------------------------------------------- */

        if (
            response.school &&
            typeof response.school === "object"
        ) {
            return response.school;
        }


        return null;
    }


    function normalizeSettings(settings) {

        if (!settings) {
            return {
                ...DEFAULT_SETTINGS
            };
        }

        return {
            school_name:
                normalizeValue(
                    settings.school_name,
                    DEFAULT_SETTINGS.school_name
                ),

            po_box:
                normalizeValue(
                    settings.po_box,
                    DEFAULT_SETTINGS.po_box
                ),

            motto:
                normalizeValue(
                    settings.motto,
                    DEFAULT_SETTINGS.motto
                ),

            head_of_school:
                normalizeValue(
                    settings.head_of_school,
                    DEFAULT_SETTINGS.head_of_school
                ),

            phone:
                normalizeValue(settings.phone),

            email:
                normalizeValue(settings.email)
        };
    }


    /* =====================================================
       UPDATE PREVIEW
    ===================================================== */

    function updatePreview() {

        if (previewSchoolName) {

            previewSchoolName.textContent =
                schoolNameInput.value.trim() ||
                DEFAULT_SETTINGS.school_name;
        }


        if (previewBox) {

            previewBox.textContent =
                schoolBoxInput.value.trim() ||
                DEFAULT_SETTINGS.po_box;
        }

        const phone = schoolPhoneInput.value.trim();
        const email = schoolEmailInput.value.trim();

        if (previewSchoolPhone) previewSchoolPhone.textContent = phone;
        if (previewSchoolEmail) previewSchoolEmail.textContent = email;
        const phoneRow = document.getElementById("previewSchoolPhoneRow");
        const emailRow = document.getElementById("previewSchoolEmailRow");
        if (phoneRow) phoneRow.hidden = !phone;
        if (emailRow) emailRow.hidden = !email;
        if (previewContact) previewContact.hidden = !phone && !email;


        if (previewMotto) {

            previewMotto.textContent =
                schoolMottoInput.value.trim() ||
                DEFAULT_SETTINGS.motto;
        }


        if (previewHead) {

            previewHead.textContent =
                headOfSchoolInput.value.trim() ||
                DEFAULT_SETTINGS.head_of_school;
        }
    }


    /* =====================================================
       POPULATE FORM
    ===================================================== */

    function populateForm(settings) {

        const data =
            normalizeSettings(settings);


        schoolNameInput.value =
            data.school_name;

        schoolBoxInput.value =
            data.po_box;

        schoolMottoInput.value =
            data.motto;

        headOfSchoolInput.value =
            data.head_of_school;

        schoolPhoneInput.value = data.phone;

        schoolEmailInput.value = data.email;


        updatePreview();
    }


    /* =====================================================
       VALIDATION
    ===================================================== */

    function validateForm() {

        const schoolName =
            schoolNameInput.value.trim();

        const poBox =
            schoolBoxInput.value.trim();

        const motto =
            schoolMottoInput.value.trim();

        const headOfSchool =
            headOfSchoolInput.value.trim();

        const email =
            schoolEmailInput.value.trim();


        /* Remove old error */

        [
            schoolNameInput,
            schoolBoxInput,
            schoolMottoInput,
            headOfSchoolInput,
            schoolPhoneInput,
            schoolEmailInput
        ].forEach((input) => {

            input.classList.remove(
                "input-error"
            );
        });


        if (!schoolName) {

            schoolNameInput.classList.add(
                "input-error"
            );

            schoolNameInput.focus();

            showToast(
                "Taarifa haijakamilika",
                "Jina la shule linahitajika.",
                "error"
            );

            return false;
        }


        if (!poBox) {

            schoolBoxInput.classList.add(
                "input-error"
            );

            schoolBoxInput.focus();

            showToast(
                "Taarifa haijakamilika",
                "P.O. Box inahitajika.",
                "error"
            );

            return false;
        }


        if (!motto) {

            schoolMottoInput.classList.add(
                "input-error"
            );

            schoolMottoInput.focus();

            showToast(
                "Taarifa haijakamilika",
                "Motto ya shule inahitajika.",
                "error"
            );

            return false;
        }


        if (!headOfSchool) {

            headOfSchoolInput.classList.add(
                "input-error"
            );

            headOfSchoolInput.focus();

            showToast(
                "Taarifa haijakamilika",
                "Jina la Head of School linahitajika.",
                "error"
            );

            return false;
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            schoolEmailInput.classList.add("input-error");
            schoolEmailInput.focus();
            showToast(
                "Taarifa haijakamilika",
                "Barua pepe ya shule si sahihi.",
                "error"
            );
            return false;
        }


        return true;
    }


    /* =====================================================
       LOADING STATE
    ===================================================== */

    function setLoading(
        loading,
        mode = "save"
    ) {

        if (!saveButton || !resetButton) {
            return;
        }


        saveButton.disabled =
            loading;

        resetButton.disabled =
            loading;


        if (loading) {

            if (mode === "save") {

                saveButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Inahifadhi...
                `;
            }

        } else {

            saveButton.innerHTML = `
                <i class="fa-solid fa-floppy-disk"></i>
                Hifadhi Mabadiliko
            `;
        }
    }


    /* =====================================================
       LOAD SCHOOL SETTINGS
    ===================================================== */

    async function loadSchoolSettings() {

        try {

            setLoading(
                true,
                "load"
            );


            console.log(
                "Loading school settings..."
            );


            const response =
                await MsongolaAPI.get(
                    "/school-settings"
                );


            console.log(
                "School settings response:",
                response
            );


            const settings =
                extractSettings(
                    response
                );


            if (settings) {

                savedSettings =
                    normalizeSettings(
                        settings
                    );

            } else {

                savedSettings =
                    {
                        ...DEFAULT_SETTINGS
                    };
            }


            populateForm(
                savedSettings
            );


        } catch (error) {

            console.error(
                "Load school settings error:",
                error
            );


            /*
             * Kama database bado haina settings,
             * tunatumia default values ili page
             * isiwe empty.
             */

            savedSettings =
                {
                    ...DEFAULT_SETTINGS
                };


            populateForm(
                savedSettings
            );


            if (error.status === 401) {

                showToast(
                    "Session imekwisha",
                    "Tafadhali ingia tena kwenye mfumo.",
                    "error"
                );

                return;
            }


            if (error.status === 403) {

                showToast(
                    "Huna ruhusa",
                    "Ni Admin pekee anayeruhusiwa kuona mipangilio.",
                    "error"
                );

                return;
            }


            /*
             * Hatutaki page ivunjike kwa sababu
             * endpoint bado haijawa ready.
             */

            console.warn(
                "School settings endpoint haijapatikana. Default values zimetumika."
            );
        }
        finally {

            setLoading(
                false,
                "load"
            );
        }
    }


    /* =====================================================
       SAVE SCHOOL SETTINGS
    ===================================================== */

    async function saveSchoolSettings(
        event
    ) {

        event.preventDefault();


        if (!validateForm()) {
            return;
        }


        const payload = {

            school_name:
                schoolNameInput.value.trim(),

            po_box:
                schoolBoxInput.value.trim(),

            motto:
                schoolMottoInput.value.trim(),

            head_of_school:
                headOfSchoolInput.value.trim(),

            phone:
                schoolPhoneInput.value.trim(),

            email:
                schoolEmailInput.value.trim()
        };


        try {

            setLoading(
                true,
                "save"
            );


            console.log(
                "Saving school settings:",
                payload
            );


            /*
             * IMPORTANT:
             *
             * This sends:
             *
             * PUT /api/school-settings
             *
             */

            const response =
                await MsongolaAPI.put(
                    "/school-settings",
                    payload
                );


            console.log(
                "Save response:",
                response
            );


            if (
                response &&
                response.success === false
            ) {

                throw new Error(
                    response.message ||
                    "Mabadiliko hayajahifadhiwa."
                );
            }


            savedSettings =
                normalizeSettings(
                    payload
                );


            populateForm(
                savedSettings
            );


            showToast(
                "Imefanikiwa",
                "Taarifa za shule zimehifadhiwa kikamilifu.",
                "success"
            );


        } catch (error) {

            console.error(
                "Save school settings error:",
                error
            );


            if (
                error.status === 401
            ) {

                showToast(
                    "Session imekwisha",
                    "Tafadhali ingia tena kwenye mfumo.",
                    "error"
                );

                return;
            }


            if (
                error.status === 403
            ) {

                showToast(
                    "Huna ruhusa",
                    "Ni Admin pekee anayeruhusiwa kubadilisha taarifa hizi.",
                    "error"
                );

                return;
            }


            if (
                error.status === 404
            ) {

                showToast(
                    "API haijapatikana",
                    "Backend haina endpoint ya /school-settings kwa sasa.",
                    "error"
                );

                console.error(
                    "EXPECTED ENDPOINT: PUT /api/school-settings"
                );

                return;
            }


            showToast(
                "Imeshindikana kuhifadhi",
                error.message ||
                "Kuna tatizo wakati wa kuhifadhi taarifa.",
                "error"
            );

        }
        finally {

            setLoading(
                false,
                "save"
            );
        }
    }


    /* =====================================================
       RESET FORM
    ===================================================== */

    function resetForm() {

        populateForm(
            savedSettings
        );


        [
            schoolNameInput,
            schoolBoxInput,
            schoolMottoInput,
            headOfSchoolInput,
            schoolPhoneInput,
            schoolEmailInput
        ].forEach((input) => {

            input.classList.remove(
                "input-error"
            );
        });


        showToast(
            "Imerejeshwa",
            "Taarifa zimerudishwa kwenye hali iliyohifadhiwa.",
            "success"
        );
    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(
        title,
        message,
        type = "success"
    ) {

        if (
            !toast ||
            !toastTitle ||
            !toastMessage ||
            !toastIcon
        ) {
            return;
        }


        clearTimeout(
            toastTimer
        );


        toastTitle.textContent =
            title;

        toastMessage.textContent =
            message;


        if (type === "error") {

            toastIcon.className =
                "fa-solid fa-circle-exclamation";

            toast.classList.add(
                "toast-error"
            );

        } else {

            toastIcon.className =
                "fa-solid fa-check";

            toast.classList.remove(
                "toast-error"
            );
        }


        toast.classList.add(
            "show"
        );


        toastTimer =
            setTimeout(() => {

                hideToast();

            }, 5000);
    }


    function hideToast() {

        if (!toast) {
            return;
        }

        toast.classList.remove(
            "show"
        );
    }


    /* =====================================================
       LIVE PREVIEW EVENTS
    ===================================================== */

    function initializePreview() {

        const inputs = [

            schoolNameInput,

            schoolBoxInput,

            schoolMottoInput,

            headOfSchoolInput,

            schoolPhoneInput,

            schoolEmailInput

        ];


        inputs.forEach((input) => {

            if (!input) {
                return;
            }


            input.addEventListener(
                "input",
                () => {

                    input.classList.remove(
                        "input-error"
                    );

                    updatePreview();
                }
            );
        });
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function initializeEvents() {

        if (form) {

            form.addEventListener(
                "submit",
                saveSchoolSettings
            );
        }


        if (resetButton) {

            resetButton.addEventListener(
                "click",
                resetForm
            );
        }


        if (closeToastButton) {

            closeToastButton.addEventListener(
                "click",
                hideToast
            );
        }


        initializePreview();
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    async function initialize() {

        console.log(
            "======================================"
        );

        console.log(
            "MSONGOLA SCHOOL SETTINGS"
        );

        console.log(
            "Initializing..."
        );

        console.log(
            "======================================"
        );


        if (
            !window.MsongolaAPI
        ) {

            console.error(
                "MsongolaAPI haijapatikana."
            );

            return;
        }


        const allowed =
            await protectPage();


        if (!allowed) {
            return;
        }


        initializeEvents();


        await loadSchoolSettings();


        console.log(
            "School Settings initialized successfully."
        );
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.MsongolaSchoolSettings = {

        load:
            loadSchoolSettings,

        save:
            saveSchoolSettings,

        reset:
            resetForm,

        updatePreview:
            updatePreview,

        getSavedSettings:
            () => ({
                ...savedSettings
            })
    };


    /* =====================================================
       START
    ===================================================== */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }

})();
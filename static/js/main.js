$(document).ready(function () {
    // Bootstrap modals
    const selectionModal = new bootstrap.Modal(document.getElementById('selectionModal'));
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    const userEntryModal = new bootstrap.Modal(document.getElementById('userEntryModal'));
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    const editModal = new bootstrap.Modal(document.getElementById('editModal'));
    const removeSelectionModal = new bootstrap.Modal(document.getElementById('removeSelectionModal'));
    const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
    const hostButton = $('#host-dashboard-button');
    const userNameTextTags = $('#user-name');
    const logoutLink = $('#logout-link');


    // Function to load squares from the API
    const loadSquares = () => {

        console.log('loading squares...');
        gameId = localStorage.getItem('gameId')
        console.log(gameId)

        if (!gameId) {
            console.log('No game ID found');
            return;
        }

        logoutLink.show();
        $('#game-board').show()

        $.getJSON('/api/squares', { game_id: gameId }, (data) => {
            console.log(`Squares data from API: \n`, data);
            console.log(localStorage.getItem('userEmail'));
            const gridContainer = $('#grid-container');
            gridContainer.empty();

            data.forEach(square => {
                const squareElement = $('<div>')
                    .addClass('grid-square')
                    .addClass(square.is_taken && square.email !== localStorage.getItem('userEmail') ? 'taken' : 'available')
                    .data('number', square.number)
                    .data('email', square.email);

                const numberElement = $('<div>')
                    .addClass('square-number')
                    .text(formatTime(square.number));

                squareElement.append(numberElement);

                if (square.is_taken) {
                    const nameElement = $('<div>')
                        .addClass('square-name')
                        .text(`${square.first_name} ${square.last_initial}.`);

                    squareElement.append(nameElement);
                }
                // Add click event only for available squares
                squareElement.click(function () {
                    if (square.is_taken) {
                        console.log(`taken by: ${square.email}`);
                        const storedEmail = localStorage.getItem('userEmail');
                        if (storedEmail === square.email) {
                            openEditModal(square.number, square.email);
                        } else {
                            console.log(`taken by: ${square.email}`);
                            // error
                        }
                    } else {
                        console.log(`available: ${square.number}`);
                        openSelectionModal(square.number);
                    }
                });

                gridContainer.append(squareElement);
            });
        });
    };

    // Function to create user player
    const createUser = (formData) => {

        if (formData.isAdmin) {
            console.log("creating new game...")
            const gameId = createGame({ ...formData});
            console.log('gameid created:  ', gameId)
            localStorage.setItem('gameId', gameId)
        }

        $.ajax({
            url: '/api/create-user',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                first_name: formData.firstName,
                last_initial: formData.lastInitial,
                email: formData.email,
                payment_method: formData.paymentMethod,
                game_id: formData.gameId? formData.gameId : localStorage.gameId,
                is_admin: formData.isAdmin
            }),
            success: function (response) {
                console.log(`Response from DB on user creation: ${response.is_admin}`)
                // Store user data
                console.log('Creating new admin user...')
                localStorage.setItem('userId', response.user_id);
                localStorage.setItem('userEmail', response.email);
                localStorage.setItem('firstName', response.first_name);
                localStorage.setItem('lastInitial', response.last_initial);
                localStorage.setItem('isAdmin', response.is_admin)
                localStorage.setItem('gameId', response.game_id)



                registerModal.hide();
                loadSquares();


            },
            error: function (xhr) {
                const response = xhr.responseJSON;
                console.log('response: ', response);
                $('#error-message').text(response?.message || 'Error creating user. Please try again.');
                errorModal.show();
            }
        });
    }

    const createGame = (formData) => {
        // Form has adminId, expectantFirstName, expectantLastInitial
        $.ajax({
            url: '/api/create-game',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                admin_id: formData.adminId,
                expectant_first_name: formData.expectantFirstName,
                expectant_last_name: formData.expectantLastName
            }),
            success: function (response) {
                console.log(`Returned from Create Game DB call: ${JSON.stringify(response)}`)
                // Store user data
                localStorage.setItem('gameId', response.data.id);
                localStorage.setItem('motherName', response.data.expectant_first_name + ' ' + response.data.expectant_last_name[0])

                registerModal.hide();
                loadSquares();
                return response.data.id;

            },
            error: function (xhr) {
                const response = xhr.responseJSON;
                console.log('response: ', response);
                $('#error-message').text(response?.message || 'Error creating user. Please try again.');
                errorModal.show();
            }
        })

    }

    const assignGameIdtoAdmin = () => {
        
    }


    // logout clears local storage
    logoutLink.click(() => {
        localStorage.clear();
        window.location.href = '/';
    })

    // Function to create user player
    const loginUser = (email) => {
        $.ajax({
            url: '/users/email',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                email: email
            }),
            success: function (response) {
                localStorage.setItem('userEmail', response.email);
                localStorage.setItem('firstName', response.first_name);
                localStorage.setItem('lastInitial', response.last_initial);
                localStorage.setItem('userId', response.id);
                localStorage.setItem('isAdmin', response.is_admin);
                localStorage.setItem('gameId', response.game_id);

                // localStorage.setItem('userId', response.user_id);
                loginModal.hide();

                if (localStorage.getItem('isAdmin')) {
                    hostButton.show();
                }
                loadSquares();

            },
            error: function (xhr) {
                const response = xhr.responseJSON;
                $('#error-message').text(response?.message || 'Something went wrong. Please try again.');
                errorModal.show();
            }
        });
    }


    // Dismiss entry modal on form submission and save user type
    $('#submit-user-type').click(function () {
        const form = $('#userEntryForm')[0];
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        const userType = $('#user-type').val().trim();
        localStorage.setItem('isAdmin', userType === 'admin');

        // Remove focus from the button before hiding the modal
        $('#submit-user-type').blur();

        userEntryModal.hide();

        // Show/hide appropriate fields based on user type
        if (userType === 'admin') {
            $('#player-fields').hide();
            $('#admin-fields').show();
        } else {
            $('#player-fields').show();
            $('#admin-fields').hide();
        }

        // Remove focus from any elements before showing the new modal
        $('#registerModal').find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').blur();
        registerModal.show();
    });

    // Add event listener for modal hidden event
    $('#userEntryModal').on('hidden.bs.modal', function () {
        // Remove focus from any elements inside the modal
        $(this).find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').blur();
    });

    // Add the login link handler
    $('#login-link').click(function () {
        registerModal.hide();
        loginModal.show();
    });

    $('#submit-email').click(()=> {
        const email = $('#welcome-email').val().trim();
        loginUser(email);
    })


    // Handle registration submission
    $('#submit-register').click(function () {
        const form = $('#registerForm')[0];

        const isAdmin = localStorage.getItem('isAdmin') === 'true';


        // Get form data AFTER validation
        const formData = {
            ...form,
            firstName: $('#first-name').val().trim(),
            lastInitial: $('#last-initial').val().trim().toUpperCase(),
            email: $('#email').val().trim(),
            isAdmin: isAdmin
        };

        console.log('Form data collected:', formData);

        if (isAdmin) {
            formData.expectantFirstName = $('#expectant-first-name').val().trim();
            formData.expectantLastName = $('#expectant-last-name').val().trim();
            console.log('Admin form data:', formData);

            // First create the user
            createUser(formData);



        } else {
            formData.paymentMethod = $('#payment-method').val();
            formData.gameId = $('#game-id').val().trim();
            console.log(formData)

            createUser(formData);
        };

    });

    

    // show user entry modal if user email is not set
    if (!localStorage.getItem('userEmail')) {
        console.log('user email not set');
        userEntryModal.show();
    }
    else {
        userName = localStorage.getItem('firstName') + ' ' + localStorage.getItem('lastInitial')
        console.log(`Stored user name: ${userName}`)
        console.log('user email set');
        userNameTextTags.text('Welcome, ' + userName);

        loadSquares();
    }

    if (localStorage.getItem('isAdmin')) {

        hostButton.show();
    }

    $('#host-dashboard-button').click(function () {
        if (!localStorage.getItem('userId')) {

        }
        window.location.href = '/admin';
    });



    // Format number as time (0:XX)
    function formatTime(num) {
        return `0:${num < 10 ? '0' + num : num}`;
    }

    // Open selection modal
    function openSelectionModal(squareNumber) {
        $('#selected-square').val(squareNumber);
        $('#selectionModalLabel').text(`Select Square (0:${squareNumber < 10 ? '0' + squareNumber : squareNumber})`);

        // Reset form
        $('#selectionForm')[0].reset();

        selectionModal.show();
    }

    // Open edit modal
    function openEditModal(squareNumber, email) {
        $('#selected-square').val(squareNumber);
        $('#editModalLabel').text(`Edit Square (0:${squareNumber < 10 ? '0' + squareNumber : squareNumber})`);

        // Reset form
        $('#editForm')[0].reset();

        // Show/hide elements based on email match
        const storedEmail = localStorage.getItem('userEmail');
        if (storedEmail === email) {
            $('#remove-selection').show();
            $('#edit-payment-method').show();
        } else {
            $('#remove-selection').hide();
            $('#edit-payment-method').hide();
        }

        // Show modal and handle focus
        editModal.show();

        // Move focus to the first focusable element in the modal
        setTimeout(() => {
            const firstFocusable = $('#editModal').find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').first();
            firstFocusable.focus();
        }, 100);
    }

    // Add event listener for modal hidden event
    $('#editModal').on('hidden.bs.modal', function () {
        // Remove focus from any elements inside the modal
        $(this).find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').blur();
    });

    $('#remove-selection').click(function () {
        editModal.hide();
        removeSelectionModal.show();
        // $('#removeSelectionForm')[0].reset();
    });

    $('#removeSelectionModal').on('hidden.bs.modal', function () {
        // Remove focus from any elements inside the modal
        $(this).find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').blur();
    });

    // Handle form submission
    $('#confirm-selection').click(function () {
        const form = $('#selectionForm')[0];

        // Basic form validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Get form data
        const squareNumber = $('#selected-square').val();
        const userId = localStorage.getItem('userId')
        const gameId = localStorage.getItem('gameId')

        // Submit selection to API
        $.ajax({
            url: '/api/select-square',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                number: parseInt(squareNumber),
                user_id: userId,
                game_id: gameId
            }),
            success: function (response) {
                selectionModal.hide();
                // confirmationModal.show();

                // // Show confirmation modal
                // $('#confirmationModal').on(() => {
                //     // Reload squares
                //     confirmationModal.hide()
                //     console.log('Loading squares after square selection...')
                //     loadSquares();
                // });
                loadSquares();
                

                // Add animation to the selected square
                setTimeout(() => {
                    const selectedSquare = $(`.grid-square[data-number="${squareNumber}"]`);
                    selectedSquare.addClass('just-selected');

                    // Remove animation class after animation completes
                    setTimeout(() => {
                        selectedSquare.removeClass('just-selected');
                    }, 1000);
                }, 100);
            },
            error: function (xhr) {
                selectionModal.hide();

                // Show error message
                const response = xhr.responseJSON;
                $('#error-message').text(response?.message || 'Something went wrong. Please try again.');
                errorModal.show();
            }
        });
    });

    // Add event listener for confirmation modal hidden event
    $('#confirmationModal').on('hidden.bs.modal', function () {
        // Remove focus from any elements inside the modal
        $(this).find('div, h5, p, button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').blur();
    });

    $('#clear-game').click(function () {
        $.ajax({
            url: '/api/clear-game',
            type: 'POST',
            success: function (response) {
                loadSquares();
            },
            data: {
                game_id: localStorage.getItem('gameId')
            },
            error: function (xhr) {
                console.error('Error clearing game:', xhr);
            }
        });
    });


    // Handle form submission
    $('#confirm-remove-selection').click(function () {
        const form = $('#removeSelectionForm')[0];


        // Get form data
        const squareNumber = $('#selected-square').val();


        // Submit selection to API
        $.ajax({
            url: '/api/remove-selection',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                number: parseInt(squareNumber)

            }),
            success: function (response) {
                selectionModal.hide();

                // Show confirmation modal
                removeSelectionModal.hide();

                // Reload squares
                loadSquares();

                // Add animation to the selected square
                setTimeout(() => {
                    const selectedSquare = $(`.grid-square[data-number="${squareNumber}"]`);
                    selectedSquare.addClass('just-selected');

                    // Remove animation class after animation completes
                    setTimeout(() => {
                        selectedSquare.removeClass('just-selected');
                    }, 1000);
                }, 100);
            },
            error: function (xhr) {
                selectionModal.hide();

                // Show error message
                const response = xhr.responseJSON;
                $('#error-message').text(response?.message || 'Something went wrong. Please try again.');
                errorModal.show();
            }
        });
    });

    // Add event listener for register modal hidden event
    $('#registerModal').on('hidden.bs.modal', function () {
        // Remove focus from any elements inside the modal
        $(this).find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').blur();
    });



    $('#selectionModal').on('hidden.bs.modal', function () {
        // Remove focus from any elements inside the modal
        $(this).find('div, h5, p, button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').blur();
    });

});

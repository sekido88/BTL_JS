$(document).ready(function() {
    $('#select-fuction-sort-by').change(function() {
        var sortCriteria = $(this).val(); 
        SortReservations(sortCriteria);     
    });
    $(document).on('click', '#search-button', function(e) {
        e.preventDefault(); 
        console.log("Search button clicked");
        var startDate = $('#start-date').val();
        var endDate = $('#end-date').val();
        SearchReservations(startDate, endDate);
    });
    UpdateStatus();
});
function UpdateStatus() {
    $('#reservations-table').on('click','.button_accept, .button_cancel', function() {
        var button = $(this);
        var reservationId = button.closest('.data-row').data('reservation-id');
        var newStatus = button.hasClass('button_accept') ? 'Confirmed' : 'Cancelled';

        $.ajax({
            url: '/admin/update_reservation_status',
            type: 'POST',
            data: {
                reservation_id: reservationId,
                status: newStatus
            },
            success: function(response) {
                if (response.status == 'success') {
  
                    var statusCol = button.closest('.data-row').find('.value:nth-child(6)');
                    statusCol.removeClass('confirmed pending cancelled').addClass(newStatus.toLowerCase()).text(newStatus);

                    button.siblings('.button_accept, .button_cancel').prop('disabled', true);
                    button.prop('disabled', true);
                } else {
                    alert('Lỗi: ' + response.message);
                }
            },
            error: function() {
                alert('Đã xảy ra lỗi khi cập nhật trạng thái đặt chỗ.');
            }
        });
    });
}
function SortReservations(criteria) {
    $.ajax({
        url: '/sort_reservations',
        method: 'POST',
        data: { sort_criteria: criteria },
        success: function(response) {
            if (response.error) {
                console.error('Error:', response.error);
                return;
            }
            $('#reservations-table').empty();
            $.each(response.reservations, function(index, reservation) {
                var newRow = '<div class="data-row">' +
                                '<div class="value">' + reservation.name + '</div>' +
                                '<div class="value">' + reservation.email + '</div>' +
                                '<div class="value">' + reservation.date + '<br>' + reservation.time + '</div>' +
                                '<div class="value">' + reservation.seats + '</div>' +
                                '<div class="value">' + reservation.special_requests + '</div>' +
                                '<div class="value">' + reservation.status + '</div>' +
                                '<div class="value">' +
                                '<button class="button_accept" data-action="accept">AC</button>' +
                                '<button class="button_cancel" data-action="cancel">CE</button>' +
                                '</div>' 
                            '</div>';
                $('#reservations-table').append(newRow);
            });
        },
        error: function(error) {
            console.error('Error:', error);
        }
    });
}
function CheckLogin() {
    isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
        window.location.href = '/login'
    }
}
function Logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/login';
}
function SearchReservations(startDate, endDate) {
    console.log("Sending AJAX request");
    $.ajax({
        url: '/admin',
        method: 'GET',
        data: { 
            start_date: startDate,
            end_date: endDate
        },
        success: function(response) {
            console.log("Received response:", response.reservations);
            if (response.reservations) {
                console.log("Updating table with", response.reservations.length, "reservations");
                updateReservationsTable(response.reservations);
            } else {
                console.error('Unexpected response format');
            }
        },
        error: function(error) {
            console.error('Error:', error);
        }
    });
}

function updateReservationsTable(reservations) {
    console.log("Updating table with reservations:", reservations);
    var tableBody = $('#reservations-table');
    tableBody.empty();
    
    reservations.forEach(function(reservation) {
        var row = $('<div class="data-row"></div>').attr('data-reservation-id', reservation.id);
        row.append('<div class="value">' + reservation.name + '</div>');
        row.append('<div class="value">' + reservation.email + '</div>');
        row.append('<div class="value">' + reservation.date + '<br>' + reservation.time + '</div>');
        row.append('<div class="value">' + reservation.seats + '</div>');
        row.append('<div class="value">' + reservation.special_requests + '</div>');
        row.append('<div class="value ' + reservation.status.toLowerCase() + '">' + reservation.status + '</div>');
        row.append('<div class="value">' +
                   '<button class="button_accept" data-action="accept">AC</button>' +
                   '<button class="button_cancel" data-action="cancel">CE</button>' +
                   '</div>');
        tableBody.append(row);
    });
    console.log("Table update complete");
    UpdateStatus();
}
CheckLogin();

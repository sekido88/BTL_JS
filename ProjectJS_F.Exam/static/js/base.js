$(document).ready(function(){

    BaseHtml();

})
function BaseHtml() {
    function ProcessFunction() {
        $("#reservation").click(function() {
            $(".fuction-restaurant").toggle();
            $("#reservation").toggleClass("clicked");
        });

        $("#button-title-function-reservation").click(function() {
            $(".fuction-restaurant").toggle(); // dong form
            $("#reservation").toggleClass("clicked");
        });

        $("#book-function-reservation-button-submit").click(function() {
            $("#reservation").toggleClass("clicked");
            $(".confirm").toggle();
        });

        $("#huybo").click(function() {
            $(".confirm").toggle();
        });

        $("#xacnhan").click(function() {
            $(".fuction-restaurant").toggle();
            $(".confirm").toggle();
        });
    }

    function HightlingTitle() {
        function HighlightTitleMenu() {
            var titleContent = $("#title").text();
            var navbarMenuItems = $(".navbar-menu-a");

            navbarMenuItems.each(function() {
                var menuItemText = $(this).text();

                if (menuItemText == titleContent) {
                    navbarMenuItems.removeClass("Highlight");
                    $(this).addClass("Highlight");

                    return false; // Dừng vòng lặp each
                }
            });
        }
        HighlightTitleMenu();
    }

    function handleClientId() {

        var clientId = localStorage.getItem('clientId');

        if (!clientId) {
            $.ajax({
                url: '/generate_client_id',
                type: 'POST',
                success: function(response) {
                    localStorage.setItem('clientId', response.client_id);
                    clientId = response.client_id;
                },
                error: function() {
                    console.error('Lỗi khi tạo client_id');
                }
            });
        }
        $('#xacnhan').on('click', function(event) {
            var formData = {
                name: $('#reservation-name').val(),
                email: $('#reservation-email').val(),
                phone: $('#reservation-tel').val(),
                date: $('#reservation-date').val(),
                time: $('#reservation-time').val(),
                seats: $('#reservation-seats').val(),
                special_requests: $('textarea[name="textarea"]').val(),
                client_id: clientId
            };

            $.ajax({
                type: 'POST',
                url: '/process_reservation',
                data: formData,
                success: function(response) {
                    alert('THÔNG TIN CỦA BẠN ĐÃ ĐƯỢC GỬI');
                },
                error: function(error) {
                    alert('VUI LÒNG THỬ LẠI', error);
                }
            });
            event.preventDefault();
        });
    }

    ProcessFunction();
    HightlingTitle();
    handleClientId();
}
var setup_login = function(){
    $('#btn-login').bind('click', function(){
                         
         var email = $('#email_id').val();
         var password = $("#password_id").val();
         
         if (!email){
         alert("O campo email é obrigatório");
         return;}
         
         if (!password){
         alert("O campo de senha é obrigatório");
         return;}
         
         app.login(email,password)
         
         });
}


var create_login = function(){
    $('body').addClass('bg-login');
    $('header').hide();
    $('footer').hide();
    var html = app.template_login.render({});
    $('#main').removeClass('main genarate');
    $('#main').addClass('content login').html(html);

}

var setup_cooperatives = function(){

    $('li.coop-number').bind('click', function(){
        window.location.href = 'tel:'+ $(this).attr('data-number');
    });

}


var create_cooperatives = function(){
    $('#main').removeClass('genarate');
    var html = app.template_cooperatives.render({cooperatives: app.cooperatives});
    $('#main').html( html );

    $('#link-tokens').show();
    $('#link-cooperatives').hide();
    setup_cooperatives();
}


var onLogout = function(buttonIndex){
	if (buttonIndex == 1) {
		app.logout();
	}
}

var setup_header_footer = function(){
    $("#btn-logout").bind("click", function(){
		navigator.notification.confirm(
        	'Deseja realmente sair?',
        	onLogout,
        	'Paggtaxi',
        	'Sim,Não'
    	);
	
    });
    
    $("#link-cooperatives").bind("click", function(){
        create_cooperatives();
    });


    $("#link-tokens").bind("click", function(){
        create_list_tokens();
    });


}



var create_list_tokens = function(){
    $('body').removeClass('bg-login');
    $('header').show();
    $('footer').show();
    $('#link-tokens').hide();
    $('#link-cooperatives').show();


    var html = app.template_list_tokens.render({tokens: app.tokens});

    $('#main').removeClass('login');
    $('#main').removeClass('content');
    $('#main').addClass('main');
    $('#main').addClass('genarate');

    $('#main').html(html);
    
    $('#btn-generate-token').bind('click', function(){
        create_generate_token();
    });

    $('#btn-refresh').bind('click', function(){
                           app.refresh_tokens();
    });
    
    
    $('a.btn-cancel').bind('click', function(){
                          var val = $(this).attr('data-pk');
                          app.cancel_token(val);
    });


}

var setup_generate_token = function(){

    $('#btn-new-token').bind('click', function(){
        var cc = $("input[name='cc']:checked").val();
        app.generate_token(cc);
    });
        
}



var create_generate_token = function(){
    $('#link-tokens').show();
    $('#link-cooperatives').hide();

	var data = {
        ccs: app.cc_tree['ccs'],
        cats: app.cc_tree['cats'],
    };
    var html = app.template_generate_token.render(data);
    $('#main').html( html );
    setup_generate_token();
	
	if (!data['ccs'] && !data['cats']){
		alert("Sua empresa ainda não cadastrou nenhum centro de custo parq eu você possa gerar um token.");
	}
}



var app = {
    initialize: function() {
        this.bindEvents();
        this.host = 'https://paggtaxi-testing.herokuapp.com/api-company/';
        this.url_login = this.host + 'login/';
        this.url_tokens = this.host + 'list-tokens/';
        this.url_cancel_token = this.host + 'cancel/';
        
        this.template_login = new EJS({url: 'templates/login.ejs'});
        this.template_list_tokens = new EJS({url: 'templates/list_tokens.ejs'});
        this.template_cooperatives = new EJS({url: 'templates/cooperatives.ejs'});
        this.template_generate_token = new EJS({url: 'templates/generate_token.ejs'});
    },
    
    
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    
    show_spinner: function(){ $('#spinner_container').show(); },
    hide_spinner: function(){ $('#spinner_container').hide(); },


    
    onDeviceReady: function() {
        
		if ( device.platform == "Android"){
			$('body').addClass("android");
			//$('header').addClass("android");
		}
		
		setup_header_footer();
        app.hide_spinner();
        if ( app.loadData() ){
            create_list_tokens();
        } else {
            create_login();
            setup_login();
        }
    },
    
    

    loadData: function() {
        /**
         Load data from localStorage to app instance.
            return false if user is not authenticated
         */
        this.auth_token = window.localStorage.getItem("auth_token", false);
        if (!this.auth_token){
            return false;
        }
        this.pk = window.localStorage.getItem("pk");
        this.email = window.localStorage.getItem("email");
        this.full_name = window.localStorage.getItem("full_name");
        
        this.cooperatives = JSON.parse(
                                       window.localStorage.getItem("cooperatives") );

        this.tokens = JSON.parse(
                                 window.localStorage.getItem("tokens") );

        this.cc_tree = JSON.parse(
                                 window.localStorage.getItem("cc_tree") );
        return true;
    },
    
    
    
    login: function(email, password){
        /** 
         Authenticates the employee
         Saves auth_token, pk, and email
         auth_token and pk are used to authenticate the user without the password
         and must me submited every request
         */
        app.show_spinner();
        $.ajax({
               type: 'POST',
               url: app.url_login,
               data: {'email': email, 'password': password},
               success:function(data){
                    data = $.parseJSON(data);
               
                    if (data.success){
                       window.localStorage.setItem("pk", data.pk);
                       window.localStorage.setItem("auth_token", data.auth_token);
                       window.localStorage.setItem("email", data.email);
                       window.localStorage.setItem("full_name", data.full_name);
                       
                       window.localStorage.setItem("cooperatives", JSON.stringify(data.cooperatives));
                       
                       window.localStorage.setItem("tokens", JSON.stringify(data.tokens));
                       
                       window.localStorage.setItem("cc_tree", JSON.stringify(data.cc_tree));
                       
                       app.loadData();
                       create_list_tokens();
                       app.hide_spinner();
                       return;
               
                    } else {
                        app.hide_spinner();
                        $('#password_id').val("");
                        alert("Usuário/Senha incorretos");
                        return;
                    }
               },
               error: function(data){
                    app.hide_spinner();
                    alert("Ocorreu um erro no login");
                    return;
               }
            });
    },

    
    generate_token: function(cc_id){
        app.show_spinner();
        $.ajax({
               type: 'POST',
               url: app.url_tokens,
               data: {'cc': cc_id, 'pk': this.pk, 'auth_token': this.auth_token},
               success:function(data){
				   data = $.parseJSON(data);
                   if (!data.sucess){
						alert("Não foi possível gerar um token pois seu limite foi atingido.");
				   } else {
					   	window.localStorage.setItem("cooperatives", JSON.stringify(data.cooperatives));
                   		window.localStorage.setItem("tokens", JSON.stringify(data.tokens));
                   		app.loadData();
				   }				   
				   create_list_tokens();
                   app.hide_spinner();
                   return;
               },
               error: function(data){
                   alert("Não foi possível gerar um token, verifique o seu limite junto ao gestor.");
                   app.hide_spinner();
                   return;
               }
               });
    },
    
    refresh_tokens: function(){
        app.show_spinner();
        $.ajax({
               type: 'GET',
               url: app.url_tokens,
               data: {'pk': this.pk, 'auth_token': this.auth_token},
               success:function(data){
                   data = $.parseJSON(data);
                   window.localStorage.setItem("cooperatives", JSON.stringify(data.cooperatives));
                   window.localStorage.setItem("tokens", JSON.stringify(data.tokens));
                   app.loadData();
                   create_list_tokens();
                   app.hide_spinner();
                   return;
               },
               error: function(data){
                    create_list_tokens();
                    app.hide_spinner();
                    alert("Não foi possível atualizar a lista de tokens");
                    return;
               }
               });
    },
        

    
    logout: function(){
        /**
         Logout user deleting his data(including auth_token)
         - must redirect user to login page with empty password
        */
        window.localStorage.clear();
        create_login();
        setup_login();
    },
    
    
    
    cancel_token: function(token){
        app.show_spinner();
        $.ajax({
               type:'POST',
               url: app.url_cancel_token,
               data: {'pk': this.pk, 'auth_token': this.auth_token, token: token},
               success:function(data){
                    app.loadData();
                    create_list_tokens();
					app.hide_spinner();
                    app.refresh_tokens();					
                    return;
               }, error: function(data){
                    create_list_tokens();
                    app.hide_spinner();
                    app.refresh_tokens();					
                    return;
               }
        });
    },
    
};
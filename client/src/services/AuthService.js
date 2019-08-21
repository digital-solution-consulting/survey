import decode from 'jwt-decode';
export default class AuthService {
    //let BaseURL = 'http://demo4393909.mockable.io/';
  

    constructor(domain) {
      this.domain = domain || 'http://164.115.17.163:8082/v1/users' // API server domain
    //  this.fetch = this.fetch.bind(this) // React binding stuff
      this.login = this.login.bind(this)
     // this.getProfile = this.getProfile.bind(this)
  }

    login(userId, password) {
        let BaseURL = 'http://164.115.17.163:8082/v1/users/login';
        console.log("login"+userId);
      return fetch(BaseURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',                  
            },
          body: JSON.stringify({
                userId: userId,
              password: password
          })
            })
            .then(this._checkStatus)
            .then((response) => response.json())
          
            .then((res) => {
                console.log("login"+res);
                this.setToken(res.data.token)
                this.setUserLogin(res.data)
                console.log("logindddddd");
                return Promise.resolve(res);
            })
            
      
       //   console.log(responseBody);
         // this.setToken(res.token) // Setting the token in localStorage
         // return Promise.resolve(responseBody);
     .catch(function(error) {
        console.log("Request failed", error);
    });
    }

    loggedIn() {
        // Checks if there is a saved token and it's still valid
         const token = this.getToken() // GEtting token from localstorage
        
         return !!token 
    }

    getUserFeed() {
        
         let  dataList = localStorage.getItem("userData");
         return dataList;
      
      }
    setUserLogin(data){
        let userlogin = data.name+" "+data.surname;
        localStorage.setItem('userlogin', userlogin)
        localStorage.setItem('session_userid',data.id);
        localStorage.setItem('level',data.level);
      
    }
    setToken(token) {
        // Saves user token to localStorage
        localStorage.setItem('token_local', token)
    }
    getToken() {
        // Retrieves the user token from localStorage
        return localStorage.getItem('token_local')
    }
  
    _checkStatus(response) {
        console.log('response.status');
        console.log(response.status);
        // raises an error in case response status is not a success
        if (response.status >= 200 && response.status < 300) { // Success status lies between 200 to 300
            return response
        } else {
            var error = new Error(response.statusText)
            error.response = response
            throw error
        }


    }
    _checkroommate(userid){
        console.log(userid);
    }

}

    // return new Promise((resolve, reject) =>{
    
         
    //     fetch(BaseURL+type, {
    //         method: 'POST',
    //         body: JSON.stringify(userData)
    //       })
    //       .then((response) => response.json())
    //       .then((res) => {
    //         resolve(res);
    //       })
    //       .catch((error) => {
    //         reject(error);
    //       });

  
    //   });


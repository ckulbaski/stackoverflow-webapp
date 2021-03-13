//conner kulbaski 78411266 
//for COMP 4350

import './App.css';
import React from 'react';
import Collapsible from 'react-collapsible'


//gets the input from the user and submits it to the parent component
class Input extends React.Component{

  constructor(props){
      super(props);
      this.state = {
          tag: ""
      }
      this.updateTag = this.updateTag.bind(this);
      this.onSubmit = this.onSubmit.bind(this);
  }

  //updates the tag when the text field changes
  updateTag = (event) => this.setState({
      tag: event.target.value
  });

  //submits the tag to the parent 
  onSubmit = (event) => {
      event.preventDefault()
      this.props.onSubmit(this.state.tag)
  }

  render(){
      return(
          <div>
              <form onSubmit={this.onSubmit}>
              <input type="text" placeholder="Enter Tag" name="tag" onChange={this.updateTag} required/>
              <button type="submit" className="btn btn-primary">Search</button>
              </form> 
          </div>
      );
  }
}

//comment to be displayed under questions
class Comment extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      data: props.data
    };
  }

  
  render(){
    var date = new Date(this.state.data.creation_date*1000).toLocaleDateString()
    if(date === "Invalid Date"){
      date= "[no date recorded]"
    }
    return (
      <div className="comment" dangerouslySetInnerHTML={{__html: this.state.data.body +"<br/> created on " +date+ ". score: " + this.state.data.score }} />
    );
  }
}

//this is a question item to be rendered as a collapsible
class Item extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      data: props.data
    };
  }


  render(){

    //gets the title of the question and the info
    var title = (
      <div className = "question">
        <h3> {this.state.data.title}</h3>
        <p> created on {new Date(this.state.data.creation_date*1000).toLocaleDateString()}, score: {this.state.data.score}</p>
      </div> 
    );

    //the body of the question. hidden in the collapsible
    var body = (
      <div className="content" dangerouslySetInnerHTML={{__html: this.state.data.body + ""}} /> 
    );


    return (
      <Collapsible trigger={title}>
        {body}
        
        <ol>
        {this.state.data.answer_count > 0? this.state.data.answers.map(answer =>(
              <li key={answer.answer_id}> <Comment data={answer} /> </li>
            )) : <p>unanswered</p> }
        {this.state.data.comment_count > 0 ? this.state.data.comments.map(comment =>(
              <li key={comment.comment_id}> <Comment data={comment} /> </li>
            )) : <p>no comments to display</p> }
        </ol>
      </Collapsible>
    );
  }

}

export default class App extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      tag: '',
      items: [],
      searched: false,
      error: false,
      numResults: 0
    }

    this.onSubmit = this.onSubmit.bind(this)
    this.getResults = this.getResults.bind(this)
  }

  async getResults(){
  
    //get the date
    var toDate = new Date()
    toDate = Math.floor(toDate.getTime() / 1000); //round to int and divide to get seconds
    var fromDate = toDate - 604800
    
    //build api get url
    let recent_url=`https://api.stackexchange.com/2.2/search?fromdate=${fromDate}&todate=${toDate}&order=desc&sort=creation&tagged=${this.state.tag}&site=stackoverflow&filter=!)c9AAUVI7)rYQm3.Y9nh)(A.wRr(tZjhjN4UbS9yz49_D`
    let voted_url=`https://api.stackexchange.com/2.2/search?fromdate=${fromDate}&todate=${toDate}&order=desc&sort=votes&tagged=${this.state.tag}&site=stackoverflow&filter=!)c9AAUVI7)rYQm3.Y9nh)(A.wRr(tZjhjN4UbS9yz49_D` 
    
    //wait for response so data is rendered
    var resp = await fetch(recent_url)
    var newest_data = await resp.json()  
    

    var arr = [];
    var num;
    console.log(newest_data);
    if(newest_data.error_id){
      this.setState({
        error: true //bad error handling 
      })
      return;
    }

    //number of data items
    num = Number(newest_data.items.length);
    await this.setState({numResults: num})
    for(let i=0; i < Math.min(num, 10); i++){
      arr.push(newest_data.items[i]) //stick every item in an array
    }
    
    resp = await fetch(voted_url) 
    var voted_data =  await resp.json()
    console.log(voted_data);
    if(voted_data.error_id){
      this.setState({
        error: true
      })
      return;
    }
    num = Number(voted_data.items.length);
    for(let i=0; i < Math.min(num, 10); i++){
      arr.push(voted_data.items[i])
    }
    num += Number(this.state.numResults);
    arr.sort(function(a,b){ //sort the array by creation date
      return b.creation_date - a.creation_date;
    });
    console.log(arr)
    await this.setState({numResults: num, items: arr}) //load the array into the state

  }

  //loads new data when the tag is updated
  async onSubmit(newTag){
    
    if(newTag !== this.state.tag){ //save API calls by making sure new tag isnt the same
      await this.setState(
        {tag: newTag, searched: true}
      );
    }
    this.getResults();
  }
  

  //main App
  render(){

    var content = (
      <ol>
        {this.state.items.map(item =>(
          <li key={item.post_id}> <Item data={item}/> </li>
        ))}
        </ol>
    )
    return (
      <main> 
        <title>StackOverflow Tag finder</title>
        <div className="App">
          <Input onSubmit={this.onSubmit}/>
          <h2> Results for {this.state.tag}:</h2>
          {this.state.error ? <h1> Generic error message! </h1> : content}
        </div>
      </main>
    );
  }
}


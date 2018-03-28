/* When the UnaBell is pressed, we trigger this function to increment the survey response
   counters: Excellent, Good, etc.  Pressing the UnaBell creates a "write" action with
   key=status, value=button_pressed

   params: is an object with the keys:
    - action: one of 'write' | 'read'
    - thingToken: the thing that triggered the trigger
    - values: only if action == 'write'. Is an array of values where each value is an object with:
    - key: the key
    - value: the data sent
    - datetime: (can be null)

   callback: is a function to be called when the trigger ends can contain a
       parameter string *error* if the trigger needs to report an error.
*/

function trigger(params, callback){
  console.log("Hello world!");
  callback();
}

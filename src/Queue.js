class Queue
{
  // initializes the queue
  constructor()
  {
    this.arr = [];
    this.pos = 0;
  }
  
  // uses the array x to fill the queue
  makeFilled(x)
  {
    this.arr = x;
    this.offset = 0;
  }

  // Returns true if the queue is empty, and false otherwise.
  isEmpty()
  {
    return (this.arr.length == 0);
  }
  
  getPos()
  {
    return this.pos;
  }

  // Enqueues x in the queue (to the end)
  enqueue(x)
  {
    this.arr.push(x);
  }
  
  // enqueues x to position i
  insert(x, i)
  {
    this.arr.splice(i, 0, x);
  }
  
  // removes item at index i
  remove(i)
  {
    this.arr.splice(i, 1);
  }

  // Dequeues an item and returns it. If the queue is empty, throws an error
  dequeue()
  {
    // if the queue is empty, throw
    if (this.arr.length == 0)
    {
      throw "Queue empty!";
    }
    
    // if the queue is at the end already, return undefined
    if (this.pos >= this.arr.length)
    {
      return undefined;
    }

    // store the item at the front of the queue
    var item = this.arr[this.pos];
    ++this.pos;

    // return the dequeued item
    return item;
  }

  // Returns the item at the front of the queue (without dequeuing it). If the
  // queue is empty then undefined is returned.
  peek()
  {
    return (this.arr.length > 0 ? this.arr[this.pos] : undefined);
  }
  
  // returns an array of all items in the queue (again, without dequeuing) from the current pos.
  read()
  {
    return this.arr.slice(this.pos);
  }
  
  // Deletes all the data, resets to as on construction
  reset()
  {
    this.arr = [];
    this.pos = 0;
  }
}

module.exports = Queue;

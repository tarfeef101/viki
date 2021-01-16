class Queue
{
  // initializes the queue
  constructor()
  {
    this.arr = [];
  }

  // uses the array x to fill the queue
  makeFilled(x)
  {
    this.arr = x;
  }

  // Returns true if the queue is empty, and false otherwise.
  isEmpty()
  {
    return (this.arr.length === 0);
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
    if (this.arr.length === 0)
    {
      throw "Queue empty!";
    }

    // store the item at the front of the queue
    const item = this.arr[0];
    this.remove(0);

    // return the dequeued item
    return item;
  }

  // Returns the item at the front of the queue (without dequeuing it). If the
  // queue is empty then undefined is returned.
  peek()
  {
    return (this.arr.length > 0 ? this.arr[0] : undefined);
  }

  // returns an array of all items in the queue (again, without dequeuing) from the current pos.
  read()
  {
    return this.arr;
  }

  // Deletes all the data, resets to as on construction
  reset()
  {
    this.arr = [];
  }

  // randomizes remaining elements of the Queue
  shuffle()
  {
    function rand(min, max)
    {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    for (var i = 0; i < this.arr.length; i++)
    {
      // we want a random index between the end and i, inclusive
      const index = rand(i, this.arr.length - 1);
      const temp = this.arr[i];
      this.arr[index] = this.arr[i];
      this.arr[i] = temp;
    }
  }
}

module.exports = Queue;

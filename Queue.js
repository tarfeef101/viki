class Queue
{
  // initializes the queue
  constructor()
  {
    this.queue = [];
    this.offset = 0;
  }

  // Returns the length of the queue.
  getLength()
  {
    return (this.queue.length - this.offset);
  }

  // Returns true if the queue is empty, and false otherwise.
  isEmpty()
  {
    return (this.queue.length == 0);
  }

  // Enqueues x in the queue (to the end)
  enqueue(x)
  {
    this.queue.push(x);
  }

  // Dequeues an item and returns it. If the queue is empty, throws an error
  dequeue()
  {
    // if the queue is empty, throw
    if (this.queue.length == 0)
    {
      throw "Queue already empty!";
    }

    // store the item at the front of the queue
    var item = this.queue[this.offset];

    // increment the offset and refactor if necessary
    if (++ this.offset * 2 >= this.queue.length)
    {
      this.queue = this.queue.slice(this.offset);
      this.offset = 0;
    }

    // return the dequeued item
    return item;
  }

  // Returns the item at the front of the queue (without dequeuing it). If the
  // queue is empty then undefined is returned.
  peek()
  {
    return (this.queue.length > 0 ? this.queue[this.offset] : undefined);
  }
  
  // Deletes all the data, resets to as on construction
  reset()
  {
    this.queue = [];
    this.offset = 0;
  }
}

module.exports = Queue;

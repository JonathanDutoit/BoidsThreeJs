class Boid {
    constructor() {
        this.position = createVector(random(width), random(height));
        this.velocity = p5.Vector.random2D();
        this.velocity.setMag(random(2, 4));
        this.acceleration = createVector();
        this.maxForce = 1;
        this.maxSpeed = 4;
    }

    edges() {
        if(this.position.x > width) {
            this.position.x = 0;
        } else if(this.position.x < 0){
            this.position.x = width;
        }

        if(this.position.y > height) {
            this.position.y = 0;
        } else if(this.position.y < 0){
            this.position.y = height;
        }
    }

    align(boids) {
        let groupVelocity = createVector();
        let perceptionRadius = 50;
        let total = 0;
        for (let neighbor of boids) {
            let d = dist(this.position.x, this.position.y, neighbor.position.x, neighbor.position.y)
            if (neighbor != this && d < perceptionRadius) {
                groupVelocity.add(neighbor.velocity);
                total++;
            }

        }
        if(total > 0) {
            groupVelocity.div(total);
            groupVelocity.setMag(this.maxSpeed);
            groupVelocity.sub(this.velocity);
            groupVelocity.limit(this.maxForce);
        }
        return groupVelocity;
    }

    separation(boids) {
        let perceptionRadius = 50;
        let steering = createVector();
        let total = 0;
        for (let neighbor of boids) {
            let d = dist(this.position.x, this.position.y, neighbor.position.x, neighbor.position.y)
            if (neighbor != this && d < perceptionRadius) {
                let diff = p5.Vector.sub(this.position, neighbor.position);
                diff.div(d);
                steering.add(diff);
                total++;
            }

        }
        if(total > 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    cohesion(boids) {
        let groupPosition = createVector();
        let perceptionRadius = 50;
        let total = 0;
        for (let neighbor of boids) {
            let d = dist(this.position.x, this.position.y, neighbor.position.x, neighbor.position.y)
            if (neighbor != this && d < perceptionRadius) {
                groupPosition.add(neighbor.position);
                total++;
            }

        }
        if(total > 0) {
            groupPosition.div(total);
            groupPosition.sub(this.position);
            groupPosition.setMag(this.maxSpeed);
            groupPosition.sub(this.velocity);
            groupPosition.limit(this.maxForce);
        }
        return groupPosition;
    }

    flock(boids) {
        let alignment = this.align(boids);
        let cohesion = this.cohesion(boids);
        let separation = this.separation(boids);

        separation.mult(separationSlider.value());
        cohesion.mult(separationSlider.value());
        alignment.mult(separationSlider.value());

        this.acceleration.add(separation);
        this.acceleration.add(cohesion);
        this.acceleration.add(alignment);
    }
 
    update() {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.acceleration.mult(0);
    }

    show() {
        strokeWeight(8);
        stroke(255);
        point(this.position.x, this.position.y);
    }
}